import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useI18n } from '../../i18n/I18nProvider';
import { useBookingSources, useCreateBooking, useUpdateBooking } from '../../api/bookings';
import type { Booking, BookingInsert, BookingUpdate } from '../../api/bookings';
import type { Unit } from '../../api/units';
import { todayISO, addDaysISO, nightsBetween, formatDateHuman } from '../../lib/dates';
import { isOtaSource } from '../../lib/bookingHelpers';
import { formatIDRWithCommas, calcOtaNetPayout } from '../../lib/money';
import { focusFirstInvalidField, formatMissingFieldsMessage } from '../../lib/validation';
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
  preselectedGuestId?: string | null;
  onSuccess: (bookingId: string) => void;
  onCancel?: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  initialBooking,
  preselectedUnitId,
  preselectedFrom,
  preselectedGuestId,
  onSuccess,
  onCancel,
}) => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();

  const isEdit = Boolean(initialBooking);

  // Form states
  const [guestId, setGuestId] = useState<string | null>(
    initialBooking?.guest_id || preselectedGuestId || null
  );

  useEffect(() => {
    if (!initialBooking && preselectedGuestId && !guestId) {
      setGuestId(preselectedGuestId);
    }
  }, [preselectedGuestId, initialBooking]);
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
  const [sourceCode, setSourceCode] = useState<string>(initialBooking?.source_code || 'walk_in');
  const isOtaCommissionable = sourceCode === 'booking' || sourceCode === 'agoda';
  const [otaEntryMode, setOtaEntryMode] = useState<'commissionable' | 'net'>(
    isOtaCommissionable ? 'commissionable' : 'net'
  );
  const [commissionableInput, setCommissionableInput] = useState<number>(
    initialBooking ? Number(initialBooking.total_amount) : 1000000
  );
  const [totalAmount, setTotalAmount] = useState<number>(
    initialBooking ? Number(initialBooking.total_amount) : 1000000
  );

  const [otaReference, setOtaReference] = useState<string>(initialBooking?.ota_reference || '');
  const [dueDate, setDueDate] = useState<string>(initialBooking?.due_date || todayISO());
  const [notes, setNotes] = useState<string>(initialBooking?.notes || '');

  // First payment
  const [hasFirstPayment, setHasFirstPayment] = useState<boolean>(!isEdit);
  const [paymentAmount, setPaymentAmount] = useState<number>(
    initialBooking ? Number(initialBooking.total_amount) : 1000000
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'app' | 'other'>('cash');
  const [paymentRef, setPaymentRef] = useState<string>('');

  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sources query
  const { data: sources = [] } = useBookingSources();
  const isOta = isOtaSource(sourceCode);
  const sourceObj = sources.find((s) => s.code === sourceCode);

  // Mutations
  const createBookingMutation = useCreateBooking();
  const updateBookingMutation = useUpdateBooking();

  // Nights calculation
  const nights =
    checkIn.length >= 10 && checkOut.length >= 10 && checkOut > checkIn
      ? nightsBetween(checkIn, checkOut)
      : 0;

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
    if (newIn.length >= 10) {
      if (!checkOut || checkOut <= newIn) {
        setCheckOut(addDaysISO(newIn, 1));
      }
      if (isOtaSource(sourceCode)) {
        setDueDate(newIn);
      }
    }
  };

  const handleUnitSelect = (id: number | null, unit: Unit | null) => {
    setUnitId(id);
    setErrors((prev) => ({ ...prev, unitId: '' }));
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
        checkIn: z
          .string()
          .min(10, t('validation.fieldRequired', { field: t('booking.checkIn') })),
        checkOut: z
          .string()
          .min(10, t('validation.fieldRequired', { field: t('booking.checkOut') })),
        adults: z
          .number()
          .int()
          .min(1, t('validation.invalidValue', { field: t('booking.adults') })),
        children: z.number().int().min(0),
        totalAmount: z
          .number()
          .int()
          .min(0, t('validation.invalidValue', { field: t('booking.totalPrice') })),
      })
      .refine((d) => !d.checkIn || !d.checkOut || d.checkOut > d.checkIn, {
        message: t('booking.invalidDates'),
        path: ['checkOut'],
      });

    const parsed = schema.safeParse({
      guestId: guestId || '',
      unitId: unitId || 0,
      checkIn,
      checkOut,
      adults,
      children,
      totalAmount,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      const missingFields: string[] = [];
      const extraDetails: string[] = [];
      const fieldLabelMap: Record<string, string> = {
        guestId: t('booking.guest'),
        unitId: t('booking.unit'),
        checkIn: t('booking.checkIn'),
        checkOut: t('booking.checkOut'),
        adults: t('booking.adults'),
        totalAmount: t('booking.totalPrice'),
      };

      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || '');
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
        if (key === 'checkOut' && issue.message === t('booking.invalidDates')) {
          extraDetails.push(t('booking.invalidDates'));
        } else if (fieldLabelMap[key]) {
          missingFields.push(fieldLabelMap[key]);
        } else if (issue.message) {
          extraDetails.push(issue.message);
        }
      }

      setErrors(fieldErrors);
      showToast('error', formatMissingFieldsMessage(missingFields, t, extraDetails));
      requestAnimationFrame(() => focusFirstInvalidField(formRef.current));
      return;
    }

    setIsSubmitting(true);
    try {
      const otaAuditNote =
        isOtaCommissionable && otaEntryMode === 'commissionable'
          ? `[سند ${sourceCode === 'booking' ? 'Booking.com' : 'Agoda'}: المبلغ الاسمي ${formatIDRWithCommas(commissionableInput)} | الصافي للبنك ${formatIDRWithCommas(totalAmount)}]`
          : null;
      const finalNotes = notes.trim()
        ? otaAuditNote
          ? `${notes.trim()}\n${otaAuditNote}`
          : notes.trim()
        : otaAuditNote || null;

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
          notes: finalNotes,
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
          notes: finalNotes,
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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 text-start" noValidate>
      {/* 1. Guest Section */}
      <Card>
        <h3 className="text-base font-bold text-navy mb-4">
          1. {t('booking.guest')}
        </h3>
        <GuestPicker
          selectedGuestId={guestId}
          onSelectGuest={(g) => {
            setGuestId(g ? g.id : null);
            setErrors((prev) => ({ ...prev, guestId: '' }));
          }}
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
              error={Boolean(errors.checkIn)}
              value={checkIn}
              onChange={(e) => {
                handleCheckInChange(e.target.value);
                setErrors((prev) => ({ ...prev, checkIn: '', checkOut: '' }));
              }}
            />
          </Field>

          <Field label={t('booking.checkOut')} required error={errors.checkOut}>
            <Input
              type="date"
              error={Boolean(errors.checkOut)}
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setErrors((prev) => ({ ...prev, checkOut: '' }));
              }}
            />
          </Field>

          <Field label={t('booking.adults')} required error={errors.adults}>
            <Input
              type="number"
              min={1}
              error={Boolean(errors.adults)}
              value={adults}
              onChange={(e) => {
                setAdults(Math.max(1, parseInt(e.target.value) || 1));
                setErrors((prev) => ({ ...prev, adults: '' }));
              }}
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

          {/* 1. Source and Reference Selection FIRST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-3 border-b border-line">
            <Field label={t('booking.source')} required>
              <Select
                value={sourceCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setSourceCode(val);
                  if (val === 'booking' || val === 'agoda') {
                    setOtaEntryMode('commissionable');
                    const calc = calcOtaNetPayout(commissionableInput);
                    setTotalAmount(calc.netPayout);
                    if (!isEdit && hasFirstPayment) setPaymentAmount(calc.netPayout);
                  } else {
                    setOtaEntryMode('net');
                    setTotalAmount(commissionableInput);
                    if (!isEdit && hasFirstPayment) setPaymentAmount(commissionableInput);
                  }
                  if (!isEdit) {
                    if (isOtaSource(val)) {
                      setPaymentMethod('app');
                      setDueDate(checkIn);
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

            {sourceCode !== 'walk_in' ? (
              <Field label={t('booking.otaReference')}>
                <Input
                  type="text"
                  placeholder="e.g. AG-123456 / 5727100486"
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
            ) : (
              <Field label={t('booking.dueDate')}>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
            )}

            {sourceCode !== 'walk_in' && (
              <Field label={t('booking.dueDate')}>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
            )}
          </div>

          {/* 2. OTA Commission Mode Toggle (Booking.com & Agoda) */}
          {(sourceCode === 'booking' || sourceCode === 'agoda') && (
            <div className="bg-white border border-line rounded-xl p-4 shadow-2xs space-y-3.5 text-start">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-line/60">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏛️</span>
                  <span className="text-xs sm:text-sm font-bold text-navy">
                    احتساب صافي حجز {sourceCode === 'booking' ? 'Booking.com' : 'Agoda'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold bg-stone/50 text-muted border border-line px-2.5 py-0.5 rounded-full font-mono">
                  نسبة الاستقطاع: 17.871% (عمولة 15% + رسوم دفع 2.35% + ضريبة 11%)
                </span>
              </div>

              {/* Segmented Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setOtaEntryMode('commissionable');
                    const calc = calcOtaNetPayout(commissionableInput);
                    setTotalAmount(calc.netPayout);
                    if (!isEdit && hasFirstPayment) setPaymentAmount(calc.netPayout);
                  }}
                  className={`p-3 rounded-lg border text-start transition-all flex items-start gap-2.5 ${
                    otaEntryMode === 'commissionable'
                      ? 'border-navy bg-navy/5 text-navy font-bold ring-1 ring-navy/20 shadow-2xs'
                      : 'border-line bg-white text-muted hover:text-ink hover:bg-stone/30'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    otaEntryMode === 'commissionable' ? 'border-navy bg-navy text-white' : 'border-slate-300'
                  }`}>
                    {otaEntryMode === 'commissionable' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </span>
                  <div>
                    <span className="block font-bold text-xs sm:text-sm text-ink">
                      المبلغ الخاضع للعمولة من السند (تلقائي) ✔
                    </span>
                    <span className="block text-[11px] text-muted mt-0.5 font-normal">
                      يكتب الموظف المبلغ من السند ويحسب النظام فوراً الصافي للبنك
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtaEntryMode('net');
                    setTotalAmount(commissionableInput);
                    if (!isEdit && hasFirstPayment) setPaymentAmount(commissionableInput);
                  }}
                  className={`p-3 rounded-lg border text-start transition-all flex items-start gap-2.5 ${
                    otaEntryMode === 'net'
                      ? 'border-navy bg-navy/5 text-navy font-bold ring-1 ring-navy/20 shadow-2xs'
                      : 'border-line bg-white text-muted hover:text-ink hover:bg-stone/30'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    otaEntryMode === 'net' ? 'border-navy bg-navy text-white' : 'border-slate-300'
                  }`}>
                    {otaEntryMode === 'net' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </span>
                  <div>
                    <span className="block font-bold text-xs sm:text-sm text-ink">
                      المبلغ الصافي الذي وصل للبنك مباشرة
                    </span>
                    <span className="block text-[11px] text-muted mt-0.5 font-normal">
                      يُعتمد المبلغ المدخل كصافي بنكي 100% دون أي اقتطاع
                    </span>
                  </div>
                </button>
              </div>

              {/* Financial Calculation Details */}
              {otaEntryMode === 'commissionable' && (
                <div className="bg-stone/25 border border-line/70 rounded-xl p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between text-muted">
                    <span>المبلغ المسجل من السند (السعر من الفاتورة):</span>
                    <span className="font-mono font-bold text-ink">
                      {formatIDRWithCommas(commissionableInput)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted">
                    <span>السعر الإجمالي للضيف قبل الخصم (Gross):</span>
                    <span className="font-mono text-muted">
                      {formatIDRWithCommas(calcOtaNetPayout(commissionableInput).gross)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-rose-600 font-medium">
                    <span>إجمالي اقتطاع المنصة (عمولة 15% + رسوم دفع 2.35% + ضريبة 11%):</span>
                    <span className="font-mono font-bold">
                      -{formatIDRWithCommas(calcOtaNetPayout(commissionableInput).totalDeductions)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-line/70 flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-navy flex items-center gap-1.5">
                      <span>🟢</span>
                      <span>صافي المبلغ الذي سوف يدخل إلى الحساب البنكي:</span>
                    </span>
                    <span className="font-mono text-sm sm:text-base font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                      {formatIDRWithCommas(calcOtaNetPayout(commissionableInput).netPayout)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Amount Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {priceMode === 'per_night' ? (
              <Field label={t('booking.pricePerNight')} required error={errors.totalAmount}>
                <MoneyInput
                  value={pricePerNight}
                  error={Boolean(errors.totalAmount)}
                  onChange={(val) => {
                    setPricePerNight(val);
                    setErrors((prev) => ({ ...prev, totalAmount: '' }));
                  }}
                />
              </Field>
            ) : (
              <Field
                label={
                  isOtaCommissionable && otaEntryMode === 'commissionable'
                    ? 'المبلغ المسجل في سند الحجز (المبلغ الخاضع للعمولة)'
                    : t('booking.totalPrice')
                }
                required
                error={errors.totalAmount}
              >
                <MoneyInput
                  value={
                    isOtaCommissionable && otaEntryMode === 'commissionable'
                      ? commissionableInput
                      : totalAmount
                  }
                  error={Boolean(errors.totalAmount)}
                  onChange={(val) => {
                    setCommissionableInput(val);
                    setErrors((prev) => ({ ...prev, totalAmount: '' }));
                    if (isOtaCommissionable && otaEntryMode === 'commissionable') {
                      const calc = calcOtaNetPayout(val);
                      setTotalAmount(calc.netPayout);
                      if (!isEdit && hasFirstPayment) setPaymentAmount(calc.netPayout);
                    } else {
                      setTotalAmount(val);
                      if (!isEdit && hasFirstPayment) setPaymentAmount(val);
                    }
                  }}
                />
              </Field>
            )}
          </div>

          {/* 4. Price & Bank Payout Summary Bar */}
          <div className="p-3.5 bg-stone/40 border border-line/60 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs text-muted block">
                {isOtaCommissionable && otaEntryMode === 'commissionable'
                  ? 'المبلغ الصافي المسجل في النظام لحساب البنك:'
                  : t('booking.totalPrice')}
              </span>
              {isOtaCommissionable && otaEntryMode === 'commissionable' ? (
                <span className="text-[11px] text-muted block">
                  (من أصل {formatIDRWithCommas(commissionableInput)} بالسند بعد خصم -{formatIDRWithCommas(calcOtaNetPayout(commissionableInput).totalDeductions)} عمولة وضرائب)
                </span>
              ) : priceMode === 'per_night' && nights > 0 ? (
                <span className="text-[11px] text-muted">
                  {nights} {t('booking.nightsCount', { count: nights })} × {formatIDRWithCommas(pricePerNight)}
                </span>
              ) : null}
            </div>
            <div className="text-end">
              <span className="font-mono font-black text-emerald-800 text-lg sm:text-xl tracking-tight block">
                {formatIDRWithCommas(totalAmount)}
              </span>
              {isOtaCommissionable && otaEntryMode === 'commissionable' && (
                <span className="text-[10px] text-emerald-700 font-bold block">
                  🟢 الصافي الفعلي المقيد في البنك
                </span>
              )}
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

      {/* 5. Payment / OTA Settlement Section (Optional, on new bookings) */}
      {!isEdit && (
        <Card className={isOta ? 'border-blue-200 bg-blue-50/20 shadow-xs' : ''}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-navy">
                5. {isOta ? t('booking.otaPaymentSectionTitle') : t('booking.firstPaymentOptional')}
              </h3>
              {isOta && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {sourceObj?.label || sourceCode.toUpperCase()}
                </span>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
              <input
                type="checkbox"
                checked={hasFirstPayment}
                onChange={(e) => setHasFirstPayment(e.target.checked)}
                className="w-4 h-4 text-navy rounded border-line"
              />
              <span>{isOta ? t('booking.otaPaymentCheckbox') : t('booking.firstPayment')}</span>
            </label>
          </div>

          {/* Explanation banner for OTA */}
          {isOta && (
            <div className="mb-4 p-3.5 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-blue-900 leading-relaxed space-y-1.5 text-start">
              <div className="font-semibold flex items-center gap-2">
                <span className="text-base shrink-0">📱</span>
                <span>
                  {t('booking.otaPaymentExplanation', {
                    source: sourceObj?.label || sourceCode.toUpperCase(),
                    checkIn: checkIn ? formatDateHuman(checkIn, lang) : '—',
                  })}
                </span>
              </div>
              <div className="text-[11px] text-blue-700/90 font-medium flex items-center gap-2 ps-6">
                <span>🗓️</span>
                <span>{t('booking.otaPaymentPaidOnHint', { checkIn: checkIn ? formatDateHuman(checkIn, lang) : '—' })}</span>
              </div>
            </div>
          )}

          {hasFirstPayment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field
                  label={
                    isOtaCommissionable && otaEntryMode === 'commissionable'
                      ? 'المبلغ الصافي الذي سيدخل الحساب البنكي'
                      : isOta
                      ? 'المبلغ المعتمد من المنصة'
                      : t('booking.amount')
                  }
                  required
                >
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
                  {isOtaCommissionable && otaEntryMode === 'commissionable' && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <span>🟢</span>
                          <span>صافي المبلغ المحول للبنك:</span>
                        </span>
                        <span className="font-mono text-sm text-emerald-800">
                          {formatIDRWithCommas(paymentAmount)}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        (من أصل {formatIDRWithCommas(commissionableInput)} بالسند بعد استقطاع عمولة المنصة والضرائب)
                      </div>
                    </div>
                  )}
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
                  {isOta ? 'المتبقي للتحصيل من النزيل عند الاستقبال:' : `${t('booking.remainingBalance')}:`}
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs ${
                    totalAmount - paymentAmount <= 0
                      ? 'bg-success/15 text-success'
                      : 'bg-warning/15 text-warning'
                  }`}
                >
                  {totalAmount - paymentAmount <= 0
                    ? isOta ? 'Rp 0 (مسدد عبر التطبيق بالكامل)' : t('booking.fullyPaidBadge')
                    : `${formatIDRWithCommas(Math.max(0, totalAmount - paymentAmount))}`}
                </span>
              </div>
            </div>
          ) : isOta ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 text-start">
              <span className="text-base shrink-0">⚠️</span>
              <span className="leading-relaxed">{t('booking.otaPayAtHotelWarning')}</span>
            </div>
          ) : null}
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
