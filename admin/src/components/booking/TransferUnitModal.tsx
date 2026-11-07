import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { formatIDR } from '../../lib/money';
import { todayISO, nightsBetween, addDaysISO, formatDateHuman } from '../../lib/dates';
import { updateBooking, createBooking, type BookingOverview, type BookingInsert } from '../../api/bookings';
import { fetchAvailableUnits, useUnits, type Unit } from '../../api/units';
import { fetchPayments, createPayment, updatePayment, deletePayment } from '../../api/payments';
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
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const today = todayISO();
  const checkIn = booking.check_in || today;
  const checkOut = booking.check_out || today;

  // Initial transfer date: today if in-stay, else check_in
  const initialTransferDate = useMemo(() => {
    if (checkIn && checkOut && today > checkIn && today < checkOut) {
      return today;
    }
    return checkIn || today;
  }, [today, checkIn, checkOut]);

  const [transferDate, setTransferDate] = useState<string>(initialTransferDate);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [priceMode, setPriceMode] = useState<'keep' | 'recalculate'>('keep');
  const [customPrice, setCustomPrice] = useState<number>(Number(booking.total_amount || 0));
  const [executionMode, setExecutionMode] = useState<'split' | 'modify_checkin'>('split');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allUnits = [] } = useUnits();

  // All parent villas
  const allVillas = useMemo(() => {
    return allUnits
      .filter((u) => u.kind === 'villa')
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [allUnits]);

  // Available whole villas map
  const availableWholeVillasMap = useMemo(() => {
    const map = new Map<number, Unit>();
    availableUnits.forEach((u) => {
      if (u.kind === 'villa') map.set(u.id, u);
    });
    return map;
  }, [availableUnits]);

  // Available child rooms grouped by villa parent_id
  const roomsByVilla = useMemo(() => {
    const map = new Map<number, Unit[]>();
    availableUnits.forEach((u) => {
      if (u.kind === 'room' && u.parent_id) {
        const list = map.get(u.parent_id) || [];
        list.push(u);
        map.set(u.parent_id, list);
      }
    });
    return map;
  }, [availableUnits]);

  // Independent rooms (Kamar Lepas without villa parent)
  const independentRooms = useMemo(() => {
    return availableUnits
      .filter((u) => u.kind === 'room' && !u.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [availableUnits]);

  // Sync transfer date when modal opens with new booking
  useEffect(() => {
    if (isOpen) {
      if (today > checkIn && today < checkOut) {
        setTransferDate(today);
      } else {
        setTransferDate(checkIn);
      }
    }
  }, [isOpen, today, checkIn, checkOut]);

  const isMidStay = transferDate > checkIn;
  const maxTransferDate = addDaysISO(checkOut, -1);

  const nightsTotal = Math.max(1, nightsBetween(checkIn, checkOut));
  const nightsFirst = isMidStay ? Math.max(1, nightsBetween(checkIn, transferDate)) : 0;
  const nightsSecond = isMidStay ? Math.max(1, nightsBetween(transferDate, checkOut)) : nightsTotal;

  const currentTotal = Number(booking.total_amount || 0);
  const ratePerNightFirst = currentTotal / nightsTotal;

  // Fetch available units from transferDate to checkOut
  useEffect(() => {
    if (!transferDate || !checkOut || transferDate >= checkOut) return;
    let active = true;
    setLoadingUnits(true);

    fetchAvailableUnits(transferDate, checkOut, booking.id)
      .then((units) => {
        if (!active) return;
        // Filter out current unit
        const candidates = units.filter((u) => u.id !== booking.unit_id);
        setAvailableUnits(candidates);
        if (candidates.length > 0) {
          // If previous selection isn't in candidates, select first
          if (!selectedUnitId || !candidates.some((c) => c.id === selectedUnitId)) {
            setSelectedUnitId(candidates[0].id);
          }
        } else {
          setSelectedUnitId(null);
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
  }, [transferDate, checkOut, booking.id, booking.unit_id, selectedUnitId]);

  const targetUnit = useMemo(() => {
    return availableUnits.find((u) => u.id === selectedUnitId);
  }, [availableUnits, selectedUnitId]);

  // Price calculations
  const { amountFirst, amountSecond, totalNew } = useMemo(() => {
    if (!isMidStay) {
      if (priceMode === 'recalculate' && targetUnit?.default_rate) {
        const total = Number(targetUnit.default_rate) * nightsTotal;
        return { amountFirst: 0, amountSecond: total, totalNew: total };
      }
      return { amountFirst: 0, amountSecond: currentTotal, totalNew: currentTotal };
    }

    const firstAmount = Math.round(ratePerNightFirst * nightsFirst);
    let secondAmount = 0;

    if (priceMode === 'keep') {
      secondAmount = Math.max(0, currentTotal - firstAmount);
    } else if (priceMode === 'recalculate' && targetUnit?.default_rate) {
      secondAmount = Number(targetUnit.default_rate) * nightsSecond;
    } else {
      secondAmount = Math.max(0, currentTotal - firstAmount);
    }

    return {
      amountFirst: firstAmount,
      amountSecond: secondAmount,
      totalNew: firstAmount + secondAmount,
    };
  }, [
    isMidStay,
    priceMode,
    targetUnit,
    currentTotal,
    nightsTotal,
    nightsFirst,
    nightsSecond,
    ratePerNightFirst,
  ]);

  useEffect(() => {
    setCustomPrice(totalNew);
  }, [totalNew]);

  const finalTotal = priceMode === 'keep' ? currentTotal : Math.max(0, customPrice);
  const priceDiff = finalTotal - currentTotal;

  const handleConfirm = async () => {
    if (!booking.id || !selectedUnitId || !targetUnit) return;
    setIsSubmitting(true);

    try {
      const reasonText = reason.trim() ? ` - ${reason.trim()}` : '';

      if (isMidStay && executionMode === 'split') {
        // ── Standard Hotel Split-Stay Execution ──
        // 1. Fetch current payments to calculate transferable amount
        const payments = await fetchPayments(booking.id);

        // 2. Create the continuation booking for the new unit
        const newBookingPayload: BookingInsert = {
          unit_id: selectedUnitId,
          check_in: transferDate,
          check_out: checkOut,
          guest_id: booking.guest_id || null,
          source_code: booking.source_code || 'walk_in',
          status: 'checked_in',
          adults: booking.adults || 1,
          children: booking.children || 0,
          total_amount: amountSecond,
          notes: `[${lang === 'ar' ? 'متابعة نقل النزيل من' : 'Lanjutan pindah unit dari'} ${booking.unit_name} (${lang === 'ar' ? 'الحجز السابق' : 'Booking sebelumnya'}: ${booking.code}) ${lang === 'ar' ? 'ابتداءً من' : 'mulai'} ${transferDate}${reasonText}]`,
        };

        const { booking: newBooking } = await createBooking(newBookingPayload);

        // 3. Reconcile payments across different dates & methods using FIFO
        let costRemainingForFirst = amountFirst;

        for (const p of payments) {
          const pAmount = Number(p.amount || 0);
          if (pAmount <= 0) continue; // skip refunds or zero amounts

          const realPaidOn: string = p.paid_on || booking.check_in || today;
          const realMethod = p.method || 'cash';

          if (costRemainingForFirst >= pAmount) {
            // This entire payment is retained to cover the first unit's cost
            costRemainingForFirst -= pAmount;
          } else if (costRemainingForFirst > 0) {
            // This payment partially covers the first unit; the remainder is transferred
            const keptAmount = costRemainingForFirst;
            const transferredAmount = pAmount - keptAmount;
            costRemainingForFirst = 0;

            // Update this payment on previous booking
            await updatePayment(p.id, {
              amount: keptAmount,
              notes: `${p.notes ? p.notes + ' · ' : ''}${
                lang === 'ar'
                  ? `سداد إقامة ${booking.unit_name} (تم ترحيل ${formatIDR(transferredAmount)} إلى ${targetUnit.name})`
                  : `Sebagian untuk ${booking.unit_name}`
              }`,
            });

            // Create transferred portion in new booking with REAL paid_on and REAL method!
            await createPayment({
              booking_id: newBooking.id,
              paid_on: realPaidOn,
              amount: transferredAmount,
              method: realMethod,
              reference: booking.code,
              notes: `${
                lang === 'ar'
                  ? `دفعة مسددة مسبقاً في ${booking.unit_name} (${booking.code}) بتاريخ ${realPaidOn} (نقل وحدة)`
                  : `Pembayaran di ${booking.unit_name} (${booking.code}) tgl ${realPaidOn}`
              }`,
            });
          } else {
            // First unit is already fully covered: this entire payment belongs to the new unit!
            await createPayment({
              booking_id: newBooking.id,
              paid_on: realPaidOn,
              amount: pAmount,
              method: realMethod,
              reference: booking.code,
              notes: `${
                lang === 'ar'
                  ? `دفعة مسددة مسبقاً في ${booking.unit_name} (${booking.code}) بتاريخ ${realPaidOn} (نقل وحدة)`
                  : `Pembayaran di ${booking.unit_name} (${booking.code}) tgl ${realPaidOn}`
              }`,
            });
            await deletePayment(p.id);
          }
        }

        // 4. Close original booking up to transferDate
        const existingNotes = booking.notes ? `${booking.notes}\n` : '';
        const closeLog = `[${lang === 'ar' ? 'تم نقل النزيل إلى' : 'Tamu dipindahkan ke'} ${targetUnit.name} ${lang === 'ar' ? 'ابتداءً من' : 'mulai'} ${transferDate} - ${lang === 'ar' ? 'حجز المتابعة' : 'booking lanjutan'}: ${newBooking.code}${reasonText}]`;

        await updateBooking(booking.id, {
          check_out: transferDate,
          total_amount: amountFirst,
          status: 'checked_out',
          notes: `${existingNotes}${closeLog}`.trim(),
        });

        showToast(
          'success',
          t('scenarios.transferSuccessContinuationToast', {
            unit: targetUnit.name,
            code: newBooking.code,
          })
        );
        onSuccess();
        onClose();
        navigate(`/bookings/${newBooking.id}`);
        return;
      }

      if (isMidStay && executionMode === 'modify_checkin') {
        // ── Modify Current Booking Check-In Date ──
        const existingNotes = booking.notes ? `${booking.notes}\n` : '';
        const log = `[${lang === 'ar' ? 'تم نقل الوحدة إلى' : 'Pindah unit ke'} ${targetUnit.name} ${lang === 'ar' ? 'وتعديل تاريخ الدخول إلى' : 'dan ubah check-in ke'} ${transferDate}${reasonText}]`;

        await updateBooking(booking.id, {
          unit_id: selectedUnitId,
          check_in: transferDate,
          total_amount: finalTotal,
          notes: `${existingNotes}${log}`.trim(),
        });

        showToast('success', t('scenarios.transferSuccessToast', { unit: targetUnit.name }));
        onSuccess();
        onClose();
        return;
      }

      // ── Full Move from Beginning (transferDate === checkIn) ──
      const existingNotes = booking.notes ? `${booking.notes}\n` : '';
      const log = `[${t('scenarios.transferLog', {
        from: booking.unit_name || 'Unit',
        to: targetUnit.name,
        date: today,
      })}${reasonText}]`;

      await updateBooking(booking.id, {
        unit_id: selectedUnitId,
        total_amount: finalTotal,
        notes: `${existingNotes}${log}`.trim(),
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
      <div className="space-y-4 text-sm text-ink text-start">
        {/* Current Unit Info */}
        <div className="p-3 bg-stone/40 rounded-xl border border-line flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">{t('scenarios.currentUnitLabel')}</div>
            <div className="font-bold text-navy text-base">{booking.unit_name}</div>
            <div className="text-[11px] text-muted">
              {formatDateHuman(checkIn, lang)} ➔ {formatDateHuman(checkOut, lang)} ({nightsTotal} {t('booking.nights')})
            </div>
          </div>
          <div className="text-end">
            <div className="text-xs text-muted">{t('booking.totalPrice')}</div>
            <div className="font-bold text-navy text-base">{formatIDR(currentTotal)}</div>
          </div>
        </div>

        {/* Transfer Date Selector */}
        <div className="p-3 rounded-xl border border-line bg-mist/30 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-navy flex items-center gap-1.5">
              <span>📅</span>
              <span>{t('scenarios.transferDateLabel')}</span>
            </label>
            <span className="text-[11px] font-mono text-muted">
              {transferDate === checkIn ? t('scenarios.transferFromBeginning', { date: checkIn }) : `${nightsSecond} ${t('booking.nights')}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
            <Input
              type="date"
              value={transferDate}
              min={checkIn}
              max={maxTransferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />

            {/* Quick date buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {today >= checkIn && today < checkOut && (
                <button
                  type="button"
                  onClick={() => setTransferDate(today)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    transferDate === today
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-ink border-line hover:border-gold'
                  }`}
                >
                  📍 {t('common.today')} ({today})
                </button>
              )}
              <button
                type="button"
                onClick={() => setTransferDate(checkIn)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  transferDate === checkIn
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-ink border-line hover:border-gold'
                }`}
              >
                🏁 {checkIn}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            {t('scenarios.transferDateHelp')}
          </p>
        </div>

        {/* Mid-Stay Periods Summary */}
        {isMidStay && (
          <div className="p-3 bg-gold/10 border border-gold/30 rounded-xl space-y-1.5 text-xs">
            <div className="font-bold text-navy flex items-center gap-1.5">
              <span>🔄</span>
              <span>{lang === 'ar' ? 'تفاصيل تقسيم الإقامة أثناء النقل:' : 'Rincian Pembagian Masa Menginap:'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white/80 rounded-lg border border-gold/20">
                <div className="font-bold text-navy">{booking.unit_name}</div>
                <div className="text-muted">
                  {checkIn} ➔ {transferDate} ({nightsFirst} {t('booking.nights')})
                </div>
                <div className="font-semibold text-ink mt-0.5">{formatIDR(amountFirst)}</div>
              </div>

              <div className="p-2 bg-white/80 rounded-lg border border-gold/20">
                <div className="font-bold text-gold-text">
                  {targetUnit ? targetUnit.name : (lang === 'ar' ? 'الوحدة البديلة' : 'Unit Pengganti')}
                </div>
                <div className="text-muted">
                  {transferDate} ➔ {checkOut} ({nightsSecond} {t('booking.nights')})
                </div>
                <div className="font-semibold text-ink mt-0.5">{formatIDR(amountSecond)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Target Unit Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-ink">
            {t('scenarios.selectNewUnitLabel')}
          </label>
          {loadingUnits ? (
            <div className="flex items-center gap-2 p-3 bg-stone/30 rounded-xl text-xs text-muted">
              <Spinner size="sm" />
              <span>{t('scenarios.loadingAvailableUnits')}</span>
            </div>
          ) : availableUnits.length === 0 ? (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs font-semibold">
              ⚠️ {t('scenarios.noAlternativeUnitsAvailable')}
            </div>
          ) : (
            <Select
              value={selectedUnitId || ''}
              onChange={(e) => setSelectedUnitId(Number(e.target.value))}
            >
              {allVillas.map((villa) => {
                const wholeVilla = availableWholeVillasMap.get(villa.id);
                const childRooms = roomsByVilla.get(villa.id) || [];

                // If neither the whole villa nor any child room is available, skip
                if (!wholeVilla && childRooms.length === 0) return null;

                const villaRate = wholeVilla?.default_rate
                  ? ` · ${formatIDR(Number(wholeVilla.default_rate))}/${t('booking.nights')}`
                  : '';

                return (
                  <optgroup key={villa.id} label={villa.name}>
                    {wholeVilla && (
                      <option value={wholeVilla.id}>
                        ★ {wholeVilla.name} ({t('calendar.wholeVilla')}){villaRate}
                      </option>
                    )}
                    {childRooms.map((room) => {
                      const roomRate = room.default_rate
                        ? ` · ${formatIDR(Number(room.default_rate))}/${t('booking.nights')}`
                        : '';
                      return (
                        <option key={room.id} value={room.id}>
                          &nbsp;&nbsp;↳ {room.name} ({t('unitKind.room')}){roomRate}
                        </option>
                      );
                    })}
                  </optgroup>
                );
              })}

              {/* Independent rooms without villa parent (Kamar Lepas) */}
              {independentRooms.length > 0 && (
                <optgroup label="Kamar Lepas">
                  {independentRooms.map((room) => {
                    const roomRate = room.default_rate
                      ? ` · ${formatIDR(Number(room.default_rate))}/${t('booking.nights')}`
                      : '';
                    return (
                      <option key={room.id} value={room.id}>
                        {room.name} ({t('unitKind.room')}){roomRate}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </Select>
          )}
        </div>

        {/* Mid-Stay Execution Method */}
        {isMidStay && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink">
              {t('scenarios.executionMethodLabel')}
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-line hover:bg-mist/50 cursor-pointer transition-all">
              <input
                type="radio"
                name="execution_mode"
                className="mt-1"
                checked={executionMode === 'split'}
                onChange={() => setExecutionMode('split')}
              />
              <div className="flex-1">
                <div className="font-bold text-xs text-navy">
                  ⭐ {t('scenarios.methodSplitStayTitle')}
                </div>
                <div className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  {t('scenarios.methodSplitStayDesc')}
                </div>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-line hover:bg-mist/50 cursor-pointer transition-all">
              <input
                type="radio"
                name="execution_mode"
                className="mt-1"
                checked={executionMode === 'modify_checkin'}
                onChange={() => setExecutionMode('modify_checkin')}
              />
              <div className="flex-1">
                <div className="font-bold text-xs text-ink">
                  {t('scenarios.methodModifyStayTitle')}
                </div>
                <div className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  {t('scenarios.methodModifyStayDesc')}
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Pricing Options */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-ink">
            {t('scenarios.pricingOptionLabel')}
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-line hover:bg-mist/50 cursor-pointer transition-all">
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
              <div className="text-[11px] text-muted mt-0.5">
                {t('scenarios.keepCurrentPriceDesc')}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-line hover:bg-mist/50 cursor-pointer transition-all">
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
              <div className="text-[11px] text-muted mt-0.5">
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
                        priceDiff > 0 ? 'text-danger' : 'text-success'
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
              className="px-2 py-0.5 rounded-full text-[11px] bg-stone/60 border border-line hover:border-navy text-muted hover:text-ink"
            >
              🔧 {t('scenarios.chipMaintenance')}
            </button>
            <button
              type="button"
              onClick={() => setReason(t('scenarios.chipUpgrade'))}
              className="px-2 py-0.5 rounded-full text-[11px] bg-stone/60 border border-line hover:border-navy text-muted hover:text-ink"
            >
              ⭐ {t('scenarios.chipUpgrade')}
            </button>
            <button
              type="button"
              onClick={() => setReason(t('scenarios.chipGuestRequest'))}
              className="px-2 py-0.5 rounded-full text-[11px] bg-stone/60 border border-line hover:border-navy text-muted hover:text-ink"
            >
              👤 {t('scenarios.chipGuestRequest')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
