import React, { useState, useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatIDR } from '../../lib/money';
import { todayISO, nightsBetween, formatDateHuman } from '../../lib/dates';
import { updateBooking, type BookingOverview } from '../../api/bookings';
import { createPayment } from '../../api/payments';
import { setUnitHousekeepingStatus } from '../../lib/housekeeping';
import { friendlyError } from '../../lib/errors';
import { useToast } from '../ui/Toast';

export interface EarlyCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingOverview;
  onSuccess: () => void;
}

export const EarlyCheckoutModal: React.FC<EarlyCheckoutModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();

  const today = todayISO();
  const checkIn = booking.check_in || today;
  const originalCheckOut = booking.check_out || today;
  const originalTotal = Number(booking.total_amount || 0);
  const paid = Number(booking.paid || 0);
  const originalNights = Math.max(1, Number(booking.nights || 1));
  const ratePerNight = Math.round(originalTotal / originalNights);

  const [actualCheckOut, setActualCheckOut] = useState<string>(today);
  const [policy, setPolicy] = useState<'prorated' | 'non_refundable' | 'custom'>('prorated');
  const [customTotal, setCustomTotal] = useState<number>(originalTotal);
  const [recordRefundNow, setRecordRefundNow] = useState<boolean>(true);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'transfer'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actualNights = useMemo(() => {
    return Math.max(1, nightsBetween(checkIn, actualCheckOut));
  }, [checkIn, actualCheckOut]);

  const settledTotal = useMemo(() => {
    if (policy === 'non_refundable') return originalTotal;
    if (policy === 'custom') return Math.max(0, customTotal);
    return Math.min(originalTotal, actualNights * ratePerNight);
  }, [policy, originalTotal, customTotal, actualNights, ratePerNight]);

  const financialDiff = paid - settledTotal;
  const isRefundDue = financialDiff > 0;
  const isBalanceDue = financialDiff < 0;
  const refundAmount = isRefundDue ? financialDiff : 0;
  const balanceToCollect = isBalanceDue ? Math.abs(financialDiff) : 0;

  const handleConfirm = async () => {
    if (!booking.id) return;
    setIsSubmitting(true);
    try {
      // 1. Record negative payment for immediate cash/transfer refund if applicable
      if (isRefundDue && recordRefundNow && refundAmount > 0) {
        await createPayment({
          booking_id: booking.id,
          amount: -refundAmount,
          method: refundMethod,
          paid_on: today,
          notes: `${t('scenarios.earlyCheckoutRefundNote')}`,
        });
      }

      // 2. Format audit note
      const log = `[${t('scenarios.earlyCheckoutLog', {
        date: actualCheckOut,
        actualNights,
        originalNights,
        settledAmount: formatIDR(settledTotal),
      })}]`;
      const existingNotes = booking.notes ? `${booking.notes}\n` : '';
      const newNotes = `${existingNotes}${log}`.trim();

      // 3. Update booking
      await updateBooking(booking.id, {
        check_out: actualCheckOut,
        total_amount: settledTotal,
        status: 'checked_out',
        notes: newNotes,
      });

      // 4. Mark unit dirty in housekeeping
      if (booking.unit_id) {
        setUnitHousekeepingStatus(booking.unit_id, 'dirty');
      }

      showToast('success', t('scenarios.earlyCheckoutSuccessToast'));
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
      title={t('scenarios.earlyCheckoutModalTitle')}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="warning"
            onClick={handleConfirm}
            loading={isSubmitting}
          >
            {t('scenarios.confirmEarlyCheckoutBtn')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-ink">
        {/* Unit & Stay Info */}
        <div className="p-3 bg-surface-alt rounded-xl border border-divider flex items-center justify-between">
          <div>
            <div className="font-bold text-ink">{booking.guest_name}</div>
            <div className="text-xs text-text-muted">{booking.unit_name} · {booking.code}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted">{t('scenarios.originalCheckOutLabel')}</div>
            <div className="font-semibold line-through text-slate-400">
              {formatDateHuman(originalCheckOut, lang)}
            </div>
          </div>
        </div>

        {/* Departure date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-ink">
            {t('scenarios.actualDepartureDateLabel')}
          </label>
          <Input
            type="date"
            min={checkIn}
            max={originalCheckOut}
            value={actualCheckOut}
            onChange={(e) => setActualCheckOut(e.target.value)}
          />
          <div className="text-xs text-text-muted">
            {t('scenarios.nightsStayedCount', {
              actual: actualNights,
              original: originalNights,
            })}
          </div>
        </div>

        {/* Policy Radios */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-ink">
            {t('scenarios.earlyCheckoutPolicyLabel')}
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-divider hover:bg-surface-alt cursor-pointer transition-all">
            <input
              type="radio"
              name="early_policy"
              className="mt-1"
              checked={policy === 'prorated'}
              onChange={() => setPolicy('prorated')}
            />
            <div className="flex-1">
              <div className="font-bold text-xs text-ink">
                {t('scenarios.policyProratedTitle')}
              </div>
              <div className="text-[11px] text-text-muted">
                {t('scenarios.policyProratedDesc', {
                  rate: formatIDR(ratePerNight),
                  total: formatIDR(actualNights * ratePerNight),
                })}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-divider hover:bg-surface-alt cursor-pointer transition-all">
            <input
              type="radio"
              name="early_policy"
              className="mt-1"
              checked={policy === 'non_refundable'}
              onChange={() => setPolicy('non_refundable')}
            />
            <div className="flex-1">
              <div className="font-bold text-xs text-ink">
                {t('scenarios.policyNonRefundableEarlyTitle')}
              </div>
              <div className="text-[11px] text-text-muted">
                {t('scenarios.policyNonRefundableEarlyDesc')}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-divider hover:bg-surface-alt cursor-pointer transition-all">
            <input
              type="radio"
              name="early_policy"
              className="mt-1"
              checked={policy === 'custom'}
              onChange={() => setPolicy('custom')}
            />
            <div className="flex-1">
              <div className="font-bold text-xs text-ink">
                {t('scenarios.policyCustomTitle')}
              </div>
              {policy === 'custom' && (
                <div className="mt-2 space-y-1">
                  <Input
                    type="number"
                    step={10000}
                    min={0}
                    value={customTotal || ''}
                    onChange={(e) => setCustomTotal(Number(e.target.value))}
                    placeholder="e.g. 500000"
                  />
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Financial Result */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-surface-alt rounded-xl border border-divider">
          <div className="p-2 rounded-lg bg-surface border border-divider">
            <div className="text-[11px] text-text-muted">{t('scenarios.settledTotalAmount')}</div>
            <div className="text-sm font-bold text-navy">{formatIDR(settledTotal)}</div>
          </div>
          <div className="p-2 rounded-lg bg-surface border border-divider">
            <div className="text-[11px] text-text-muted">
              {isRefundDue ? t('scenarios.guestRefundDue') : t('booking.balanceAmount')}
            </div>
            <div
              className={`text-sm font-bold ${
                isRefundDue
                  ? 'text-emerald-700'
                  : isBalanceDue
                  ? 'text-rose-700'
                  : 'text-slate-600'
              }`}
            >
              {isRefundDue
                ? formatIDR(refundAmount)
                : isBalanceDue
                ? formatIDR(balanceToCollect)
                : '0'}
            </div>
          </div>
        </div>

        {/* Immediate refund checkbox if guest is owed money */}
        {isRefundDue && (
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-950">
              <input
                type="checkbox"
                checked={recordRefundNow}
                onChange={(e) => setRecordRefundNow(e.target.checked)}
              />
              <span>{t('scenarios.recordRefundNowCheckbox')}</span>
            </label>

            {recordRefundNow && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs text-slate-600">{t('booking.method')}:</span>
                <Select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as 'cash' | 'transfer')}
                  className="text-xs py-1"
                >
                  <option value="cash">{t('paymentMethod.cash')}</option>
                  <option value="transfer">{t('paymentMethod.transfer')}</option>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
