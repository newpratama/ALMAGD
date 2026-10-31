import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useI18n } from '../../i18n/I18nProvider';
import { useBookingSources, useCreateBooking, useUpdateBooking } from '../../api/bookings';
import type { Booking, BookingInsert, BookingUpdate } from '../../api/bookings';
import type { Unit } from '../../api/units';
import { todayISO, addDaysISO, nightsBetween } from '../../lib/dates';
import { formatIDRWithCommas } from '../../lib/money';
import { MoneyInput } from '../ui/MoneyInput';
import { friendlyError } from '../../lib/errors';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { GuestPicker } from './GuestPicker';
import { UnitPicker } from './UnitPicker';
import { useToast } from '../ui/Toast';

export interface BookingFormProps {
  initialBooking?: Booking;
  preselectedUnitId?: number | null;
  preselectedFrom?: string | null;
  onSuccess: (bookingId: string) => void;
  onCancel?: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  initialBooking,
  preselectedUnitId,
  preselectedFrom,
  onSuccess,
  onCancel,
}) => {
  const { t } = useI18n();
  const { showToast } = useToast();

  const isEdit = Boolean(initialBooking);

  // Form states
  const [guestId, setGuestId] = useState<string | null>(initialBooking?.guest_id || null);
  const [checkIn, setCheckIn] = useState<string>(
    initialBooking?.check_in || preselectedFrom || todayISO()
  );
  const [checkOut, setCheckOut] = useState<string>(
    initialBooking?.check_out || addDaysISO(preselectedFrom || todayISO(), 1)
  );
  const [adults, setAdults] = useState<number>(initialBooking?.adults ?? 1);
  const [children, setChildren] = useState<number>(initialBooking?.children ?? 0);
  const [unitId, setUnitId] = useState<number | null>(
    initialBooking?.unit_id || preselectedUnitId || null
  );

  // Price mode: 'per_night' or 'total'
  const [priceMode, setPriceMode] = useState<'per_night' | 'total'>('total');
  const [pricePerNight, setPricePerNight] = useState<number>(1000000);
  const [totalAmount, setTotalAmount] = useState<number>(
    initialBooking ? Number(initialBooking.total_amount) : 1000000
  );

  const [sourceCode, setSourceCode] = useState<string>(initialBooking?.source_code || 'walk_in');
  const [otaReference, setOtaReference] = useState<string>(initialBooking?.ota_reference || '');
  const [dueDate, setDueDate] = useState<string>(initialBooking?.due_date || '');
  const [notes, setNotes] = useState<string>(initialBooking?.notes || '');

  // First payment
  const [hasFirstPayment, setHasFirstPayment] = useState<boolean>(!isEdit);
  const [paymentAmount, setPaymentAmount] = useState<number>(
    initialBooking ? Number(initialBooking.total_amount) : 1000000
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'app' | 'other'>('cash');
  const [paymentRef, setPaymentRef] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sources query
  const { data: sources = [] } = useBookingSources();

  // Mutations
  const createBookingMutation = useCreateBooking();
  const updateBookingMutation = useUpdateBooking();

  // Nights calculation
  const nights = checkIn && checkOut && checkOut > checkIn ? nightsBetween(checkIn, checkOut) : 0;

  // Sync total when price per night or nights change in 'per_night' mode
  useEffect(() => {
    if (priceMode === 'per_night') {
      const calculated = pricePerNight * Math.max(1, nights);
      setTotalAmount(calculated);
      if (!isEdit && hasFirstPayment) {
        setPaymentAmount(calculated);
      }
    }
  }, [priceMode, pricePerNight, nights, isEdit, hasFirstPayment]);

  // When check-in changes and check-out <= check-in, set check-out to check-in + 1
  const handleCheckInChange = (newIn: string) => {
    setCheckIn(newIn);
    if (!checkOut || checkOut <= newIn) {
      setCheckOut(addDaysISO(newIn, 1));
    }
  };

  const handleUnitSelect = (id: number | null, unit: Unit | null) => {
    setUnitId(id);
    if (unit?.default_rate && !isEdit) {
      const rate = Number(unit.default_rate);
      setPricePerNight(rate);
      const calculated = rate * Math.max(1, nights);
      setTotalAmount(calculated);
      setPaymentAmount(calculated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Zod validation
    const allowEmptyGuest = isEdit && !initialBooking?.guest_id;
    const schema = z
      .object({
        guestId: allowEmptyGuest
          ? z.string().optional()
          : z.string().min(1, t('booking.guestRequired')),
        unitId: z.number().int().positive(t('booking.unitRequired')),
        checkIn: z.string().min(10),
        checkOut: z.string().min(10),
        adults: z.number().int().min(1),
        children: z.number().int().min(0),
        totalAmount: z.number().int().min(0),
      })
      .refine((d) => d.checkOut > d.checkIn, {
        message: t('booking.invalidDates'),
        path: ['checkOut'],
      });

    const parsed = schema.safeParse({
      guestId: guestId || undefined,
      unitId: unitId || 0,
      checkIn,
      checkOut,
      adults,
      children,
      totalAmount,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && initialBooking) {
        const updatePayload: BookingUpdate = {
          guest_id: guestId,
          unit_id: unitId!,
          check_in: checkIn,
          check_out: checkOut,
          adults,
          children,
          source_code: sourceCode,
          ota_reference: sourceCode !== 'walk_in' ? otaReference.trim() || null : null,
          total_amount: totalAmount,
          due_date: dueDate || null,
          notes: notes.trim() || null,
        };
        const updated = await updateBookingMutation.mutateAsync({
          id: initialBooking.id,
          updates: updatePayload,
        });
        showToast('success', t('booking.bookingSaved'));
        onSuccess(updated.id);
      } else {
        const insertPayload: BookingInsert = {
          guest_id: guestId,
          unit_id: unitId!,
          check_in: checkIn,
          check_out: checkOut,
          adults,
          children,
          source_code: sourceCode,
          ota_reference: sourceCode !== 'walk_in' ? otaReference.trim() || null : null,
          total_amount: totalAmount,
          due_date: dueDate || null,
          notes: notes.trim() || null,
          status: 'confirmed',
        };

        const firstPaymentPayload =
          hasFirstPayment && paymentAmount > 0
            ? {
                amount: paymentAmount,
                method: paymentMethod,
                paid_on: checkIn,
                reference: paymentRef.trim() || undefined,
              }
            : undefined;

        const result = await createBookingMutation.mutateAsync({
          input: insertPayload,
          firstPayment: firstPaymentPayload,
        });

        showToast('success', t('booking.bookingSaved'));
        if (result.paymentError) {
          showToast('error', t(friendlyError(result.paymentError)));
        }
        onSuccess(result.booking.id);
      }
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      if (errObj?.code === '23P01') {
        showToast('error', t('errors.unitNotAvailable'));
        setErrors((prev) => ({ ...prev, unitId: t('booking.unitTaken') }));
      } else {
        showToast('error', t(friendlyError(err)));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-start">
      {/* 1. Guest Section */}
      <Card>
        <h3 className="text-base font-bold text-navy mb-4">
          1. {t('booking.guest')}
        </h3>
        <GuestPicker
          selectedGuestId={guestId}
          onSelectGuest={(g) => setGuestId(g ? g.id : null)}
          error={errors.guestId}
        />
        {isEdit && !guestId && (
          <p className="mt-2 text-xs text-muted italic">
            ℹ️ {t('booking.unassignedGuest')}
          </p>
        )}
      </Card>

      {/* 2. Stay Section */}
      <Card>
        <h3 className="text-base font-bold text-navy mb-4">
          2. {t('booking.checkIn')} &amp; {t('booking.checkOut')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Field label={t('booking.checkIn')} required error={errors.checkIn}>
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => handleCheckInChange(e.target.value)}
            />
          </Field>

          <Field label={t('booking.checkOut')} required error={errors.checkOut}>
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </Field>

          <Field label={t('booking.adults')} required>
            <Input
              type="number"
              min={1}
              value={adults}
              onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </Field>

          <Field label={t('booking.children')}>
            <Input
              type="number"
              min={0}
              value={children}
              onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </Field>
        </div>

        {nights > 0 && (
          <p className="mt-3 text-xs font-semibold text-navy">
            🌙 {t('booking.nightsCount', { count: nights })}
          </p>
        )}
      </Card>

      {/* 3. Unit Section */}
      <Card>
        <h3 className="text-base font-bold text-navy mb-4">
          3. {t('booking.unit')}
        </h3>
        <UnitPicker
          checkIn={checkIn}
          checkOut={checkOut}
          selectedUnitId={unitId}
          onSelectUnit={handleUnitSelect}
          preselectedUnitId={preselectedUnitId}
          excludeBookingId={initialBooking?.id}
          error={errors.unitId}
        />
      </Card>

      {/* 4. Price & Details Section */}
      <Card>
        <h3 className="text-base font-bold text-navy mb-4">
          4. {t('booking.totalPrice')} &amp; {t('booking.source')}
        </h3>

        <div className="space-y-4">
          {/* Price Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-stone/50 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setPriceMode('total')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                priceMode === 'total'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('booking.priceModeTotal')}
            </button>
            <button
              type="button"
              onClick={() => setPriceMode('per_night')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                priceMode === 'per_night'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('booking.priceModePerNight')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {priceMode === 'per_night' ? (
              <Field label={t('booking.pricePerNight')} required>
                <MoneyInput
                  value={pricePerNight}
                  onChange={(val) => setPricePerNight(val)}
                />
              </Field>
            ) : (
              <Field label={t('booking.totalPrice')} required error={errors.totalAmount}>
                <MoneyInput
                  value={totalAmount}
                  error={Boolean(errors.totalAmount)}
                  onChange={(val) => {
                    setTotalAmount(val);
                    if (!isEdit && hasFirstPayment) setPaymentAmount(val);
                  }}
                />
              </Field>
            )}

            <Field label={t('booking.source')} required>
              <Select
                value={sourceCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setSourceCode(val);
                  if (!isEdit) {
                    if (val !== 'walk_in' && val !== 'direct') {
                      setPaymentMethod('app');
                      if (otaReference) setPaymentRef(otaReference);
                    } else {
                      if (paymentMethod === 'app') {
                        setPaymentMethod('cash');
                        setPaymentRef('CSH-01');
                      }
                    }
                  }
                }}
              >
                {sources.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>

            {sourceCode !== 'walk_in' && (
              <Field label={t('booking.otaReference')}>
                <Input
                  type="text"
                  placeholder="e.g. AG-123456"
                  value={otaReference}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOtaReference(val);
                    if (!isEdit && paymentMethod === 'app') {
                      setPaymentRef(val);
                    }
                  }}
                />
              </Field>
            )}

            <Field label={t('booking.dueDate')}>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>

          <div className="p-3.5 bg-stone/40 border border-line/60 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs text-muted block">{t('booking.totalPrice')}</span>
              {priceMode === 'per_night' && nights > 0 && (
                <span className="text-[11px] text-muted">
                  {nights} {t('booking.nightsCount', { count: nights })} × {formatIDRWithCommas(pricePerNight)}
                </span>
              )}
            </div>
            <div className="text-end">
              <span className="font-bold text-navy text-lg tracking-tight block">
                {formatIDRWithCommas(totalAmount)}
              </span>
            </div>
          </div>

          <Field label={t('booking.notes')}>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* 5. First Payment Section (Optional, on new bookings) */}
      {!isEdit && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-navy">
              5. {t('booking.firstPaymentOptional')}
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
              <input
                type="checkbox"
                checked={hasFirstPayment}
                onChange={(e) => setHasFirstPayment(e.target.checked)}
                className="w-4 h-4 text-navy rounded border-line"
              />
              <span>{t('booking.firstPayment')}</span>
            </label>
          </div>

          {hasFirstPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label={t('booking.amount')} required>
                  <MoneyInput
                    value={paymentAmount}
                    onChange={(val) => setPaymentAmount(val)}
                    fullAmountButton={
                      totalAmount > 0
                        ? {
                            amount: totalAmount,
                            label: t('booking.fullAmount'),
                          }
                        : undefined
                    }
                  />
                </Field>

                <Field label={t('booking.method')} required>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => {
                      const newM = e.target.value as typeof paymentMethod;
                      setPaymentMethod(newM);
                      if (newM === 'app' && otaReference && !paymentRef) {
                        setPaymentRef(otaReference);
                      } else if (newM === 'cash' && !paymentRef) {
                        setPaymentRef('CSH-01');
                      }
                    }}
                  >
                    <option value="cash">{t('paymentMethod.cash')}</option>
                    <option value="transfer">{t('paymentMethod.transfer')}</option>
                    <option value="app">{t('paymentMethod.app')}</option>
                    <option value="other">{t('paymentMethod.other')}</option>
                  </Select>
                </Field>

                <Field
                  label={
                    paymentMethod === 'app'
                      ? `${t('booking.reference')} (سند دفع التطبيق / OTA Ref)`
                      : paymentMethod === 'transfer'
                      ? `${t('booking.reference')} (رقم إشعار الحوالة البنكية)`
                      : paymentMethod === 'cash'
                      ? `${t('booking.reference')} (رقم سند القبض النقدي)`
                      : t('booking.reference')
                  }
                >
                  <Input
                    type="text"
                    placeholder={
                      paymentMethod === 'cash'
                        ? 'رقم سند القبض (مثال: CSH-01)'
                        : paymentMethod === 'app'
                        ? (otaReference || 'رقم سند الدفع من التطبيق OTA Ref')
                        : paymentMethod === 'transfer'
                        ? 'رقم العملية من إشعار التحويل البنكي (مثل: TRF-BCA-849201)'
                        : 'Receipt # / Ref'
                    }
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                </Field>
              </div>

              {/* Live remaining balance calculation badge */}
              <div className="p-3 rounded-lg border text-xs flex items-center justify-between gap-2 bg-stone/30 border-line/60">
                <span className="font-medium text-ink">
                  {t('booking.remainingBalance')}:
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs ${
                    totalAmount - paymentAmount <= 0
                      ? 'bg-success/15 text-success'
                      : 'bg-warning/15 text-warning'
                  }`}
                >
                  {totalAmount - paymentAmount <= 0
                    ? t('booking.fullyPaidBadge')
                    : `${formatIDRWithCommas(Math.max(0, totalAmount - paymentAmount))}`}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : isEdit ? t('booking.editTitle') : t('booking.createTitle')}
        </Button>
      </div>
    </form>
  );
};
