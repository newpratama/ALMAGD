import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatIDR } from '../../lib/money';
import { todayISO } from '../../lib/dates';
import { updateBooking, type BookingOverview } from '../../api/bookings';
import { createPayment } from '../../api/payments';
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

  // Policy options: 'full_refund' | 'partial_penalty' | 'full_penalty'
  const [policy, setPolicy] = useState<'full_refund' | 'partial_penalty' | 'full_penalty'>(
    isNoShow ? 'full_penalty' : paidAmount > 0 ? 'full_refund' : 'full_refund'
  );
  const [customPenalty, setCustomPenalty] = useState<number>(0);
  const [recordRefundNow, setRecordRefundNow] = useState<boolean>(true);
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

      // 1. If refund should be recorded immediately and refundDue > 0
      if (paidAmount > 0 && refundDue > 0 && recordRefundNow) {
        await createPayment({
          booking_id: booking.id,
          amount: -refundDue,
          method: refundMethod,
          paid_on: today,
          notes:
            refundMethod === 'app'
              ? `${t('scenarios.otaRefundNote', { source: sourceName })} (${isNoShow ? t('status.no_show') : t('status.cancelled')})`
              : `${t('scenarios.refundNotePrefix')} (${isNoShow ? t('status.no_show') : t('status.cancelled')})`,
        });
      }

      // 2. Format notes audit record
      const actionLabel = isNoShow ? t('scenarios.noShowAction') : t('scenarios.cancelAction');
      const refundBadge =
        recordRefundNow && refundDue > 0
          ? refundMethod === 'app'
            ? ` (${t('scenarios.otaRefundSettledBadge')})`
            : ` (${t('scenarios.refundPaidImmediate')})`
          : '';

      const penaltyLog = `[${actionLabel} ${today} | ${t('scenarios.hotelPenalty')}: ${formatIDR(
        penaltyAmount
      )} | ${t('scenarios.guestRefund')}: ${formatIDR(refundDue)}${refundBadge}]`;

      const existingNotes = booking.notes ? `${booking.notes}\n` : '';
      const newNotes = `${existingNotes}${penaltyLog}`.trim();

      // 3. Update booking status, notes, and adjust total_amount to retained penalty
      await updateBooking(booking.id, {
        status: newStatus,
        total_amount: penaltyAmount,
        notes: newNotes,
      });

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
      maxWidth="md"
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
        <div className="p-3 bg-surface-alt rounded-xl border border-divider flex items-center justify-between">
          <div>
            <div className="font-bold text-ink">{booking.guest_name || t('common.guest')}</div>
            <div className="text-xs text-text-muted">{booking.code} · {booking.unit_name}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted">{t('booking.totalPrice')}</div>
            <div className="font-bold text-navy">{formatIDR(totalAmount)}</div>
          </div>
        </div>

        {paidAmount === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed text-xs">
            ⚠️ {t('scenarios.freeCancelNoPaymentMsg')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-900">
                {t('scenarios.currentPaidAmount')}
              </span>
              <span className="text-base font-bold text-emerald-800">
                {formatIDR(paidAmount)}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-ink">
                {t('scenarios.cancellationPolicyTitle')}
              </label>

              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-divider hover:bg-surface-alt cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="policy"
                    className="mt-1"
                    checked={policy === 'full_refund'}
                    onChange={() => setPolicy('full_refund')}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-xs text-ink">
                      {t('scenarios.policyFullRefund')}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {t('scenarios.policyFullRefundDesc')}
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-divider hover:bg-surface-alt cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="policy"
                    className="mt-1"
                    checked={policy === 'partial_penalty'}
                    onChange={() => {
                      setPolicy('partial_penalty');
                      if (customPenalty === 0) setCustomPenalty(Math.round(paidAmount / 2));
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-xs text-ink">
                      {t('scenarios.policyPartialPenalty')}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {t('scenarios.policyPartialPenaltyDesc')}
                    </div>
                  </div>
                </label>

                {policy === 'partial_penalty' && (
                  <div className="ps-7 pe-2 py-1 space-y-2">
                    <label className="text-xs font-semibold text-slate-700">
                      {t('scenarios.penaltyAmountLabel')} (IDR)
                    </label>
                    <Input
                      type="number"
                      step={10000}
                      min={0}
                      max={paidAmount}
                      value={customPenalty || ''}
                      onChange={(e) => setCustomPenalty(Number(e.target.value))}
                      placeholder="e.g. 200000"
                    />
                  </div>
                )}

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-divider hover:bg-surface-alt cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="policy"
                    className="mt-1"
                    checked={policy === 'full_penalty'}
                    onChange={() => setPolicy('full_penalty')}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-xs text-ink">
                      {t('scenarios.policyFullPenalty')}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {t('scenarios.policyFullPenaltyDesc')}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-surface-alt rounded-xl border border-divider">
              <div className="p-2 rounded-lg bg-surface border border-divider">
                <div className="text-[11px] text-text-muted">{t('scenarios.hotelRetainedPenalty')}</div>
                <div className="text-sm font-bold text-amber-700">{formatIDR(penaltyAmount)}</div>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-divider">
                <div className="text-[11px] text-text-muted">{t('scenarios.guestRefundDue')}</div>
                <div className="text-sm font-bold text-emerald-700">{formatIDR(refundDue)}</div>
              </div>
            </div>

            {/* Immediate refund execution checkbox */}
            {refundDue > 0 && (
              <div
                className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isOta
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-blue-50/60 border-blue-200'
                }`}
              >
                {isOta && (
                  <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded-lg border border-amber-300/60">
                    <span className="text-base">📱</span>
                    <div className="flex-1">
                      <span className="font-bold block">
                        {t('scenarios.otaRefundNoticeTitle', { source: sourceName })}
                      </span>
                      <span className="text-[11px] leading-relaxed block mt-0.5">
                        {t('scenarios.otaRefundNotice', { source: sourceName })}
                      </span>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={recordRefundNow}
                    onChange={(e) => setRecordRefundNow(e.target.checked)}
                    className="w-4 h-4 rounded text-navy"
                  />
                  <span>
                    {isOta
                      ? t('scenarios.recordRefundNowCheckboxOta', { source: sourceName })
                      : t('scenarios.recordRefundNowCheckbox')}
                  </span>
                </label>

                {recordRefundNow && (
                  <div className="pt-2 flex items-center gap-2">
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
        )}
      </div>
    </Modal>
  );
};
