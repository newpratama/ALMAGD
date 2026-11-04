import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatIDR } from '../../lib/money';
import { todayISO } from '../../lib/dates';
import { updateBooking, type BookingOverview } from '../../api/bookings';
import { createPayment, deleteBookingPayments } from '../../api/payments';
import { friendlyError } from '../../lib/errors';
import { useToast } from '../ui/Toast';
import { isOtaSource } from '../../lib/bookingHelpers';

export interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingOverview;
  isNoShow?: boolean;
  onSuccess: () => void;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  isNoShow = false,
  onSuccess,
}) => {
  const { t } = useI18n();
  const { showToast } = useToast();

  const isOta = isOtaSource(booking.source_code);
  const sourceName =
    (booking.source_code && t(`source.${booking.source_code}`)) ||
    booking.source_code ||
    'OTA';

  const paidAmount = Number(booking.paid || 0);
  const totalAmount = Number(booking.total_amount || 0);

  // Policy options: 'full_refund' (تم إرجاع المبلغ) | 'full_penalty' (لم يتم إرجاع المبلغ) | 'partial_penalty' (جزئي)
  const [policy, setPolicy] = useState<'full_refund' | 'partial_penalty' | 'full_penalty'>(
    isNoShow ? 'full_penalty' : paidAmount > 0 ? 'full_refund' : 'full_refund'
  );
  const [customPenalty, setCustomPenalty] = useState<number>(0);
  // How full refund is handled: 'void' (حذف وتصفير الدفعات) vs 'refund_tx' (تسجيل سند سالب)
  const [refundMode, setRefundMode] = useState<'void' | 'refund_tx'>('void');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'transfer' | 'app'>(
    isOta ? 'app' : 'cash'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const penaltyAmount =
    policy === 'full_refund'
      ? 0
      : policy === 'full_penalty'
      ? paidAmount
      : Math.min(paidAmount, Math.max(0, customPenalty));

  const refundDue = Math.max(0, paidAmount - penaltyAmount);

  const handleConfirm = async () => {
    if (!booking.id) return;
    setIsSubmitting(true);
    try {
      const newStatus = isNoShow ? 'no_show' : 'cancelled';
      const today = todayISO();
      const actionLabel = isNoShow ? t('scenarios.noShowAction') : t('scenarios.cancelAction');

      if (policy === 'full_refund') {
        // CASE 1: تم إرجاع المبلغ للنزيل / تصفير وإلغاء المدفوعات
        if (paidAmount > 0) {
          if (refundMode === 'void') {
            // Delete all payments so no phantom income or negative balance remains in daily reports
            await deleteBookingPayments(booking.id);
          } else {
            // Record official negative refund transaction
            await createPayment({
              booking_id: booking.id,
              amount: -paidAmount,
              method: refundMethod,
              paid_on: today,
              notes:
                refundMethod === 'app'
                  ? `${t('scenarios.otaRefundNote', { source: sourceName })} (${actionLabel})`
                  : `${t('scenarios.refundNotePrefix')} (${actionLabel})`,
            });
          }
        }

        const penaltyLog = `[${actionLabel} ${today} | ${t('scenarios.policyFullRefundCardTitle')} | ${t('scenarios.guestRefund')}: ${formatIDR(paidAmount)}]`;
        const existingNotes = booking.notes ? `${booking.notes}\n` : '';
        const newNotes = `${existingNotes}${penaltyLog}`.trim();

        await updateBooking(booking.id, {
          status: newStatus,
          total_amount: 0,
          notes: newNotes,
        });
      } else if (policy === 'full_penalty') {
        // CASE 2: لم يتم إرجاع المبلغ (غير مسترد - احتفاظ بكامل المبلغ كرسوم إلغاء للفندق)
        const penaltyLog = `[${actionLabel} ${today} | ${t('scenarios.policyFullPenaltyCardTitle')} | ${t('scenarios.hotelPenalty')}: ${formatIDR(paidAmount)} (غير مسترد)]`;
        const existingNotes = booking.notes ? `${booking.notes}\n` : '';
        const newNotes = `${existingNotes}${penaltyLog}`.trim();

        await updateBooking(booking.id, {
          status: newStatus,
          total_amount: paidAmount, // Booking total matches retained fee (balance is zero)
          notes: newNotes,
        });
      } else {
        // CASE 3: استرداد جزئي
        if (refundDue > 0) {
          await createPayment({
            booking_id: booking.id,
            amount: -refundDue,
            method: refundMethod,
            paid_on: today,
            notes:
              refundMethod === 'app'
                ? `${t('scenarios.otaRefundNote', { source: sourceName })} (${actionLabel})`
                : `${t('scenarios.refundNotePrefix')} (${actionLabel})`,
          });
        }

        const penaltyLog = `[${actionLabel} ${today} | ${t('scenarios.hotelPenalty')}: ${formatIDR(
          penaltyAmount
        )} | ${t('scenarios.guestRefund')}: ${formatIDR(refundDue)}]`;
        const existingNotes = booking.notes ? `${booking.notes}\n` : '';
        const newNotes = `${existingNotes}${penaltyLog}`.trim();

        await updateBooking(booking.id, {
          status: newStatus,
          total_amount: penaltyAmount,
          notes: newNotes,
        });
      }

      showToast('success', t('common.success'));
      onSuccess();
      onClose();
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isNoShow ? t('scenarios.noShowModalTitle') : t('scenarios.cancelModalTitle')}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={isNoShow ? 'warning' : 'danger'}
            onClick={handleConfirm}
            loading={isSubmitting}
          >
            {isNoShow ? t('scenarios.confirmNoShowBtn') : t('scenarios.confirmCancelBtn')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-ink">
        {/* Booking summary bar */}
        <div className="p-3.5 bg-surface-alt rounded-2xl border border-divider flex items-center justify-between">
          <div>
            <div className="font-bold text-ink text-base">{booking.guest_name || t('common.guest')}</div>
            <div className="text-xs text-text-muted mt-0.5">
              <span className="font-mono font-semibold">{booking.code}</span> · {booking.unit_name} · {booking.nights} {t('booking.nightsCount', { count: booking.nights ?? 1 })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted">{t('booking.totalPrice')}</div>
            <div className="font-bold text-navy text-base">{formatIDR(totalAmount)}</div>
          </div>
        </div>

        {paidAmount === 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed text-xs space-y-1">
            <div className="font-bold text-sm">⚠️ {t('scenarios.freeCancelNoPaymentMsg')}</div>
            <div>سيتم إلغاء الحجز وتفريغ الوحدة فوراً ليصبح متاحاً للنزلاء الآخرين دون أي أثر مالي.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Paid badge */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-900">
                💰 {t('scenarios.currentPaidAmount')}:
              </span>
              <span className="text-lg font-black text-emerald-800">
                {formatIDR(paidAmount)}
              </span>
            </div>

            {/* Policy Selection Cards */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">
                {t('scenarios.cancellationPolicyTitle')}:
              </div>

              {/* CARD 1: تم إرجاع المبلغ (استرداد كامل / إلغاء الدفعات) */}
              <div
                onClick={() => setPolicy('full_refund')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  policy === 'full_refund'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-divider hover:border-emerald-300 hover:bg-surface-alt'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="policy"
                    className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    checked={policy === 'full_refund'}
                    onChange={() => setPolicy('full_refund')}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-black text-sm text-emerald-950 flex items-center gap-1.5">
                        <span>↩️</span>
                        <span>{t('scenarios.policyFullRefundCardTitle')}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {t('scenarios.policyFullRefundCardBadge')}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {t('scenarios.policyFullRefundCardDesc')}
                    </p>

                    {/* Options inside Card 1 */}
                    {policy === 'full_refund' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/80 space-y-2">
                        <div className="text-xs font-bold text-emerald-950">
                          طريقة تسوية الدفعات في النظام:
                        </div>

                        <label className="flex items-center gap-2 text-xs font-medium text-emerald-900 cursor-pointer">
                          <input
                            type="radio"
                            name="refundMode"
                            checked={refundMode === 'void'}
                            onChange={() => setRefundMode('void')}
                            className="text-emerald-600"
                          />
                          <span>
                            🗑️ <strong>{t('scenarios.voidPaymentsModeLabel')}</strong>
                          </span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-medium text-emerald-900 cursor-pointer">
                          <input
                            type="radio"
                            name="refundMode"
                            checked={refundMode === 'refund_tx'}
                            onChange={() => setRefundMode('refund_tx')}
                            className="text-emerald-600"
                          />
                          <span>
                            🧾 <strong>{t('scenarios.recordRefundModeLabel')}</strong>
                          </span>
                        </label>

                        {refundMode === 'refund_tx' && (
                          <div className="flex items-center gap-2 pt-1 pl-6">
                            <span className="text-xs text-slate-600">{t('booking.method')}:</span>
                            <Select
                              value={refundMethod}
                              onChange={(e) =>
                                setRefundMethod(e.target.value as 'cash' | 'transfer' | 'app')
                              }
                              className="text-xs py-1"
                            >
                              {isOta && (
                                <option value="app">
                                  📱 {t('scenarios.otaRefundMethodLabel', { source: sourceName })}
                                </option>
                              )}
                              <option value="cash">💵 {t('paymentMethod.cash')}</option>
                              <option value="transfer">🏦 {t('paymentMethod.transfer')}</option>
                              {!isOta && (
                                <option value="app">📱 {t('paymentMethod.app')}</option>
                              )}
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 2: لم يتم إرجاع المبلغ (غير مسترد / الاحتفاظ كرسوم للفندق) */}
              <div
                onClick={() => setPolicy('full_penalty')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  policy === 'full_penalty'
                    ? 'border-rose-500 bg-rose-50/60 shadow-sm ring-2 ring-rose-500/20'
                    : 'border-divider hover:border-rose-300 hover:bg-surface-alt'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="policy"
                    className="mt-1 w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    checked={policy === 'full_penalty'}
                    onChange={() => setPolicy('full_penalty')}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-black text-sm text-rose-950 flex items-center gap-1.5">
                        <span>🔒</span>
                        <span>{t('scenarios.policyFullPenaltyCardTitle')}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        {t('scenarios.policyFullPenaltyCardBadge')}
                      </span>
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed">
                      {t('scenarios.policyFullPenaltyCardDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3: استرداد جزئي (اقتطاع رسوم + استرداد الباقي) */}
              <div
                onClick={() => setPolicy('partial_penalty')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  policy === 'partial_penalty'
                    ? 'border-amber-500 bg-amber-50/60 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-divider hover:border-amber-300 hover:bg-surface-alt'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="policy"
                    className="mt-1 w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    checked={policy === 'partial_penalty'}
                    onChange={() => setPolicy('partial_penalty')}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-black text-sm text-amber-950 flex items-center gap-1.5">
                        <span>⚖️</span>
                        <span>{t('scenarios.policyPartialPenaltyCardTitle')}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        {t('scenarios.policyPartialPenaltyCardBadge')}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      {t('scenarios.policyPartialPenaltyCardDesc')}
                    </p>

                    {policy === 'partial_penalty' && (
                      <div className="pt-2 space-y-2">
                        <label className="block text-xs font-bold text-ink">
                          {t('scenarios.penaltyAmountLabel')} (IDR):
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={paidAmount}
                          value={customPenalty || ''}
                          onChange={(e) => setCustomPenalty(Number(e.target.value))}
                          placeholder="مثال: 500000"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-surface-alt rounded-2xl border border-divider">
              <div className="p-3 rounded-xl bg-surface border border-divider">
                <div className="text-[11px] text-text-muted">{t('scenarios.hotelRetainedPenalty')}</div>
                <div className="text-base font-black text-amber-700">{formatIDR(penaltyAmount)}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-divider">
                <div className="text-[11px] text-text-muted">{t('scenarios.guestRefundDue')}</div>
                <div className="text-base font-black text-emerald-700">{formatIDR(refundDue)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
