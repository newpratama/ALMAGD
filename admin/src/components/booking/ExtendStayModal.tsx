import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { formatIDR } from '../../lib/money';
import { addDaysISO, nightsBetween, formatDateHuman } from '../../lib/dates';
import { updateBooking, type BookingOverview } from '../../api/bookings';
import { fetchAvailableUnits } from '../../api/units';
import { friendlyError } from '../../lib/errors';
import { useToast } from '../ui/Toast';

export interface ExtendStayModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingOverview;
  onSuccess: () => void;
}

export const ExtendStayModal: React.FC<ExtendStayModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();

  const currentCheckOut = booking.check_out || '';
  const currentTotal = Number(booking.total_amount || 0);
  const currentNights = Math.max(1, Number(booking.nights || 1));
  const ratePerNight = Math.round(currentTotal / currentNights);

  const [newCheckOut, setNewCheckOut] = useState<string>(() =>
    currentCheckOut ? addDaysISO(currentCheckOut, 1) : ''
  );
  const [extraAmount, setExtraAmount] = useState<number>(ratePerNight);
  const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false);
  const [isUnitAvailable, setIsUnitAvailable] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const extraNights = useMemo(() => {
    if (!currentCheckOut || !newCheckOut) return 0;
    return nightsBetween(currentCheckOut, newCheckOut);
  }, [currentCheckOut, newCheckOut]);

  // Recalculate suggested rate and check availability whenever newCheckOut changes
  useEffect(() => {
    if (!newCheckOut || !currentCheckOut || extraNights <= 0) return;

    const suggested = ratePerNight * extraNights;
    setExtraAmount(suggested);

    let active = true;
    setCheckingAvailability(true);
    fetchAvailableUnits(currentCheckOut, newCheckOut, booking.id)
      .then((avail) => {
        if (!active) return;
        const found = avail.some((u) => u.id === booking.unit_id);
        setIsUnitAvailable(found);
      })
      .catch(() => {
        if (!active) return;
        setIsUnitAvailable(true); // fallback
      })
      .finally(() => {
        if (active) setCheckingAvailability(false);
      });

    return () => {
      active = false;
    };
  }, [newCheckOut, currentCheckOut, extraNights, ratePerNight, booking.id, booking.unit_id]);

  const handleQuickAdd = (days: number) => {
    if (!currentCheckOut) return;
    setNewCheckOut(addDaysISO(currentCheckOut, days));
  };

  const handleConfirm = async () => {
    if (!booking.id || extraNights <= 0) return;
    setIsSubmitting(true);
    try {
      const newTotal = currentTotal + extraAmount;
      const log = `[${t('scenarios.extendStayLog', {
        date: newCheckOut,
        nights: extraNights,
        amount: formatIDR(extraAmount),
      })}]`;
      const existingNotes = booking.notes ? `${booking.notes}\n` : '';
      const newNotes = `${existingNotes}${log}`.trim();

      await updateBooking(booking.id, {
        check_out: newCheckOut,
        total_amount: newTotal,
        notes: newNotes,
      });

      showToast('success', t('scenarios.extendSuccessToast'));
      onSuccess();
      onClose();
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const newTotal = currentTotal + extraAmount;
  const newBalance = Number(booking.balance || 0) + extraAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('scenarios.extendStayModalTitle')}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={extraNights <= 0 || !isUnitAvailable || checkingAvailability}
          >
            {t('scenarios.confirmExtendBtn')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-ink">
        {/* Unit & Stay Info */}
        <div className="p-3 bg-surface-alt rounded-xl border border-divider flex items-center justify-between">
          <div>
            <div className="font-bold text-ink">{booking.unit_name}</div>
            <div className="text-xs text-text-muted">{booking.guest_name} · {booking.code}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted">{t('scenarios.currentCheckOutLabel')}</div>
            <div className="font-bold text-navy">
              {currentCheckOut ? formatDateHuman(currentCheckOut, lang) : '—'}
            </div>
          </div>
        </div>

        {/* Quick extension buttons */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            {t('scenarios.quickExtendButtons')}:
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAdd(1)}
              className="py-1.5 px-2 text-xs font-bold rounded-lg border border-divider bg-surface hover:bg-surface-alt transition-all"
            >
              +1 {t('scenarios.oneNight')}
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(2)}
              className="py-1.5 px-2 text-xs font-bold rounded-lg border border-divider bg-surface hover:bg-surface-alt transition-all"
            >
              +2 {t('scenarios.twoNights')}
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(3)}
              className="py-1.5 px-2 text-xs font-bold rounded-lg border border-divider bg-surface hover:bg-surface-alt transition-all"
            >
              +3 {t('scenarios.threeNights')}
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(7)}
              className="py-1.5 px-2 text-xs font-bold rounded-lg border border-divider bg-surface hover:bg-surface-alt transition-all"
            >
              +7 {t('scenarios.oneWeek')}
            </button>
          </div>
        </div>

        {/* Date input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-ink">
            {t('scenarios.newCheckOutLabel')}
          </label>
          <Input
            type="date"
            min={currentCheckOut ? addDaysISO(currentCheckOut, 1) : undefined}
            value={newCheckOut}
            onChange={(e) => setNewCheckOut(e.target.value)}
          />
          {newCheckOut && (
            <div className="text-xs text-text-muted">
              {formatDateHuman(newCheckOut, lang)} ({extraNights} {t('booking.nights')}{' '}
              {t('scenarios.additional')})
            </div>
          )}
        </div>

        {/* Availability status */}
        {checkingAvailability ? (
          <div className="flex items-center gap-2 text-xs text-text-muted p-2 bg-surface-alt rounded-lg">
            <Spinner size="sm" />
            <span>{t('scenarios.checkingUnitAvailability')}...</span>
          </div>
        ) : !isUnitAvailable ? (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            ⚠️ {t('scenarios.unitConflictWarning')}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <span>✨</span>
            <span>{t('scenarios.unitAvailableForExtension')}</span>
          </div>
        )}

        {/* Pricing calculation */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-ink">
            {t('scenarios.additionalChargeLabel')} (IDR)
          </label>
          <Input
            type="number"
            step={10000}
            min={0}
            value={extraAmount || ''}
            onChange={(e) => setExtraAmount(Number(e.target.value))}
          />
          <div className="text-[11px] text-text-muted">
            {t('scenarios.suggestedRateCalc', {
              rate: formatIDR(ratePerNight),
              nights: extraNights,
            })}
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-surface-alt rounded-xl border border-divider">
          <div className="p-2 rounded-lg bg-surface border border-divider">
            <div className="text-[11px] text-text-muted">{t('scenarios.newTotalAmountLabel')}</div>
            <div className="text-sm font-bold text-navy">{formatIDR(newTotal)}</div>
          </div>
          <div className="p-2 rounded-lg bg-surface border border-divider">
            <div className="text-[11px] text-text-muted">{t('scenarios.newBalanceDueLabel')}</div>
            <div className="text-sm font-bold text-rose-700">{formatIDR(newBalance)}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
