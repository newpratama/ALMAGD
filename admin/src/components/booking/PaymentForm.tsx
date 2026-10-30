import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { Payment, PaymentInsert, PaymentUpdate } from '../../api/payments';
import { todayISO } from '../../lib/dates';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { MoneyInput } from '../ui/MoneyInput';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

export interface PaymentFormProps {
  bookingId: string;
  initialPayment?: Payment;
  defaultAmount?: number;
  onSubmit: (data: PaymentInsert | PaymentUpdate) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  bookingId,
  initialPayment,
  defaultAmount = 0,
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const { t } = useI18n();

  const isEdit = Boolean(initialPayment);
  const initialAmount = initialPayment ? Math.abs(Number(initialPayment.amount)) : defaultAmount;
  const initialIsRefund = initialPayment ? Number(initialPayment.amount) < 0 : false;

  type MethodType = 'cash' | 'transfer' | 'app' | 'other';
  const initialMethod = (initialPayment?.method as MethodType) || 'cash';

  const [isRefund, setIsRefund] = useState(initialIsRefund);
  const [amount, setAmount] = useState<number>(initialAmount > 0 ? initialAmount : 500000);
  const [method, setMethod] = useState<MethodType>(initialMethod);
  const [paidOn, setPaidOn] = useState<string>(initialPayment?.paid_on || todayISO());
  const [reference, setReference] = useState<string>(initialPayment?.reference || '');
  const [notes, setNotes] = useState<string>(initialPayment?.notes || '');
  const [amountError, setAmountError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = amount;
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setAmountError(t('common.required'));
      return;
    }
    setAmountError(null);

    const finalAmount = isRefund ? -Math.abs(numAmount) : Math.abs(numAmount);

    if (isEdit) {
      const payload: PaymentUpdate = {
        amount: finalAmount,
        method,
        paid_on: paidOn,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      };
      await onSubmit(payload);
    } else {
      const payload: PaymentInsert = {
        booking_id: bookingId,
        amount: finalAmount,
        method,
        paid_on: paidOn,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      };
      await onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-start">
      {/* Refund Toggle */}
      <div className="p-3 bg-stone/40 rounded-lg flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
          <input
            type="checkbox"
            checked={isRefund}
            onChange={(e) => setIsRefund(e.target.checked)}
            className="w-4 h-4 text-danger rounded border-line"
          />
          <span className={isRefund ? 'text-danger font-bold' : ''}>
            {t('booking.refundToggle')}
          </span>
        </label>
        {isRefund && (
          <span className="text-xs text-danger font-bold uppercase tracking-wider">
            ⚠️ REFUND
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('booking.amount')} required error={amountError || undefined}>
          <MoneyInput
            value={amount}
            error={Boolean(amountError)}
            onChange={(val) => setAmount(val)}
            fullAmountButton={
              defaultAmount > 0
                ? {
                    amount: defaultAmount,
                    label: t('booking.fullAmount'),
                  }
                : undefined
            }
          />
        </Field>

        <Field label={t('booking.method')} required>
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
          >
            <option value="cash">{t('paymentMethod.cash')}</option>
            <option value="transfer">{t('paymentMethod.transfer')}</option>
            <option value="app">{t('paymentMethod.app')}</option>
            <option value="other">{t('paymentMethod.other')}</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('booking.dueDate')} required>
          <Input
            type="date"
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
          />
        </Field>

        <Field label={t('booking.reference')}>
          <Input
            type="text"
            placeholder="No. Transaksi / Bukti"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </Field>
      </div>

      <Field label={t('booking.notes')}>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          variant={isRefund ? 'danger' : 'primary'}
          disabled={loading}
        >
          {loading ? t('common.loading') : isEdit ? t('common.save') : t('booking.addPayment')}
        </Button>
      </div>
    </form>
  );
};
