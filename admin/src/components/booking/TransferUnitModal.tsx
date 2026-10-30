import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { formatIDR } from '../../lib/money';
import { todayISO } from '../../lib/dates';
import { updateBooking, type BookingOverview } from '../../api/bookings';
import { fetchAvailableUnits, type Unit } from '../../api/units';
import { friendlyError } from '../../lib/errors';
import { useToast } from '../ui/Toast';

export interface TransferUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingOverview;
  onSuccess: () => void;
}

export const TransferUnitModal: React.FC<TransferUnitModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [priceMode, setPriceMode] = useState<'keep' | 'recalculate'>('keep');
  const [customPrice, setCustomPrice] = useState<number>(Number(booking.total_amount || 0));
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTotal = Number(booking.total_amount || 0);

  useEffect(() => {
    if (!booking.check_in || !booking.check_out) return;
    let active = true;
    setLoadingUnits(true);

    fetchAvailableUnits(booking.check_in, booking.check_out, booking.id)
      .then((units) => {
        if (!active) return;
        // Filter out current unit
        const candidates = units.filter((u) => u.id !== booking.unit_id);
        setAvailableUnits(candidates);
        if (candidates.length > 0 && !selectedUnitId) {
          setSelectedUnitId(candidates[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch available units for transfer', err);
      })
      .finally(() => {
        if (active) setLoadingUnits(false);
      });

    return () => {
      active = false;
    };
  }, [booking.check_in, booking.check_out, booking.id, booking.unit_id]);

  const targetUnit = useMemo(() => {
    return availableUnits.find((u) => u.id === selectedUnitId);
  }, [availableUnits, selectedUnitId]);

  // If user picks recalculate, suggest price based on target unit rate * nights
  useEffect(() => {
    if (priceMode === 'recalculate' && targetUnit && targetUnit.default_rate) {
      const nights = Math.max(1, Number(booking.nights || 1));
      setCustomPrice(Number(targetUnit.default_rate) * nights);
    } else if (priceMode === 'keep') {
      setCustomPrice(currentTotal);
    }
  }, [priceMode, targetUnit, booking.nights, currentTotal]);

  const newTotal = priceMode === 'keep' ? currentTotal : Math.max(0, customPrice);
  const priceDiff = newTotal - currentTotal;

  const handleConfirm = async () => {
    if (!booking.id || !selectedUnitId || !targetUnit) return;
    setIsSubmitting(true);
    try {
      const today = todayISO();
      const reasonText = reason.trim() ? ` - ${reason.trim()}` : '';
      const log = `[${t('scenarios.transferLog', {
        from: booking.unit_name || 'Unit',
        to: targetUnit.name,
        date: today,
      })}${reasonText}]`;

      const existingNotes = booking.notes ? `${booking.notes}\n` : '';
      const newNotes = `${existingNotes}${log}`.trim();

      await updateBooking(booking.id, {
        unit_id: selectedUnitId,
        total_amount: newTotal,
        notes: newNotes,
      });

      showToast('success', t('scenarios.transferSuccessToast', { unit: targetUnit.name }));
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
      title={t('scenarios.transferModalTitle')}
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
            disabled={!selectedUnitId || loadingUnits}
          >
            {t('scenarios.confirmTransferBtn')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-ink">
        {/* Current Unit Info */}
        <div className="p-3 bg-surface-alt rounded-xl border border-divider flex items-center justify-between">
          <div>
            <div className="text-xs text-text-muted">{t('scenarios.currentUnitLabel')}</div>
            <div className="font-bold text-ink text-base">{booking.unit_name}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted">{t('booking.totalPrice')}</div>
            <div className="font-bold text-navy">{formatIDR(currentTotal)}</div>
          </div>
        </div>

        {/* Target Unit Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-ink">
            {t('scenarios.selectNewUnitLabel')}
          </label>
          {loadingUnits ? (
            <div className="flex items-center gap-2 p-3 bg-surface-alt rounded-xl text-xs text-text-muted">
              <Spinner size="sm" />
              <span>{t('scenarios.loadingAvailableUnits')}...</span>
            </div>
          ) : availableUnits.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              ⚠️ {t('scenarios.noAlternativeUnitsAvailable')}
            </div>
          ) : (
            <Select
              value={selectedUnitId || ''}
              onChange={(e) => setSelectedUnitId(Number(e.target.value))}
            >
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.kind === 'villa' ? t('unitKind.villa') : t('unitKind.room')})
                  {u.default_rate ? ` · ${formatIDR(Number(u.default_rate))}/${t('booking.nights')}` : ''}
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Pricing Options */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-ink">
            {t('scenarios.pricingOptionLabel')}
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-divider hover:bg-surface-alt cursor-pointer transition-all">
            <input
              type="radio"
              name="transfer_price"
              className="mt-1"
              checked={priceMode === 'keep'}
              onChange={() => setPriceMode('keep')}
            />
            <div className="flex-1">
              <div className="font-bold text-xs text-ink">
                {t('scenarios.keepCurrentPriceTitle')}
              </div>
              <div className="text-[11px] text-text-muted">
                {t('scenarios.keepCurrentPriceDesc')}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-divider hover:bg-surface-alt cursor-pointer transition-all">
            <input
              type="radio"
              name="transfer_price"
              className="mt-1"
              checked={priceMode === 'recalculate'}
              onChange={() => setPriceMode('recalculate')}
            />
            <div className="flex-1">
              <div className="font-bold text-xs text-ink">
                {t('scenarios.adjustPriceForNewUnitTitle')}
              </div>
              <div className="text-[11px] text-text-muted">
                {t('scenarios.adjustPriceForNewUnitDesc')}
              </div>
              {priceMode === 'recalculate' && (
                <div className="mt-2 space-y-1">
                  <Input
                    type="number"
                    step={10000}
                    min={0}
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    placeholder="Total price"
                  />
                  {priceDiff !== 0 && (
                    <div
                      className={`text-xs font-semibold ${
                        priceDiff > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {priceDiff > 0
                        ? `+${formatIDR(priceDiff)} ${t('scenarios.priceDifferenceExtra')}`
                        : `-${formatIDR(Math.abs(priceDiff))} ${t('scenarios.priceDifferenceDiscount')}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Reason for Transfer */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-ink">
            {t('scenarios.transferReasonLabel')}
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('scenarios.transferReasonPlaceholder')}
          />
          {/* Quick chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <button
              type="button"
              onClick={() => setReason(t('scenarios.chipMaintenance'))}
              className="px-2 py-0.5 rounded-full text-[11px] bg-surface-alt border border-divider hover:border-navy text-text-muted hover:text-ink"
            >
              🔧 {t('scenarios.chipMaintenance')}
            </button>
            <button
              type="button"
              onClick={() => setReason(t('scenarios.chipUpgrade'))}
              className="px-2 py-0.5 rounded-full text-[11px] bg-surface-alt border border-divider hover:border-navy text-text-muted hover:text-ink"
            >
              ⭐ {t('scenarios.chipUpgrade')}
            </button>
            <button
              type="button"
              onClick={() => setReason(t('scenarios.chipGuestRequest'))}
              className="px-2 py-0.5 rounded-full text-[11px] bg-surface-alt border border-divider hover:border-navy text-text-muted hover:text-ink"
            >
              👤 {t('scenarios.chipGuestRequest')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
