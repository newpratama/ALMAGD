import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { Payment } from '../../api/payments';
import { formatDateHuman } from '../../lib/dates';
import { formatIDR } from '../../lib/money';
import { Table, Thead, Tbody, Tr, Th, Td } from '../ui/Table';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

export interface PaymentListProps {
  payments: Payment[];
  bookingCode?: string | null;
  defaultOtaRef?: string | null;
  sourceLabel?: string | null;
  onAddPayment: () => void;
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (payment: Payment) => void;
  canManage: boolean;
}

function formatLocalizedNote(note: string | null | undefined, lang: string): string {
  if (!note) return '—';
  if (lang === 'ar') {
    let res = note.replace(
      /\[?Check-out awal pada (\d{4}-\d{2}-\d{2}) setelah menginap (\d+) malam dari (\d+) malam - Total akhir: (Rp [0-9.]+)\]?/g,
      '[مغادرة مبكرة في $1 بعد قضاء $2 ليلة من أصل $3 - المبلغ النهائي: $4]'
    );
    res = res.replace(/Pengembalian dana karena check-out lebih awal/g, 'استرداد مالي بسبب المغادرة المبكرة');
    res = res.replace(/Pengembalian dana tamu \(Refund\)/g, 'استرداد مالي للنزيل');
    return res;
  }
  return note;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  payments,
  bookingCode,
  defaultOtaRef,
  sourceLabel,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  canManage,
}) => {
  const { t, lang } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-navy">
          💳 {t('booking.paymentsTitle')} ({payments.length})
        </h3>
        <Button variant="primary" size="sm" onClick={onAddPayment}>
          + {t('booking.addPayment')}
        </Button>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          title={t('common.noData')}
          description={t('booking.paymentsTitle')}
          action={
            <Button variant="secondary" size="sm" onClick={onAddPayment}>
              + {t('booking.addPayment')}
            </Button>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>{t('booking.paymentDate')}</Th>
              <Th>{t('booking.method')}</Th>
              <Th>{t('booking.reference')}</Th>
              <Th>{t('booking.notes')}</Th>
              <Th>{t('booking.amount')}</Th>
              <Th>{t('common.actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {payments.map((p) => {
              const numAmount = Number(p.amount);
              const isRefund = numAmount < 0;

              return (
                <Tr key={p.id}>
                  <Td className="text-xs text-muted whitespace-nowrap">
                    {formatDateHuman(p.paid_on, lang)}
                  </Td>
                  <Td>
                    <Badge variant="navy">
                      {t(`paymentMethod.${p.method}`)}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs">
                    {p.reference?.trim() ? (
                      <div>
                        <span className="font-bold text-ink">{p.reference.trim()}</span>
                        {p.method === 'app' && (
                          <span className="text-[10px] text-muted block">{sourceLabel || t('paymentMethod.app')}</span>
                        )}
                      </div>
                    ) : p.method === 'app' ? (
                      <div>
                        <span className="font-bold text-navy">
                          {defaultOtaRef || (bookingCode ? `APP-${bookingCode}` : '—')}
                        </span>
                        <span className="text-[10px] text-muted block">{sourceLabel || t('paymentMethod.app')}</span>
                      </div>
                    ) : p.method === 'transfer' ? (
                      <div>
                        <span className="font-bold text-ink">
                          {bookingCode ? `TRF-${bookingCode}` : '—'}
                        </span>
                        <span className="text-[10px] text-muted block">{t('paymentMethod.transfer')}</span>
                      </div>
                    ) : p.method === 'cash' ? (
                      <div>
                        <span className="font-bold text-ink">
                          {bookingCode ? `CSH-${bookingCode}` : '—'}
                        </span>
                        <span className="text-[10px] text-muted block">{t('paymentMethod.cash')}</span>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td className="text-xs text-muted max-w-xs truncate" title={formatLocalizedNote(p.notes, lang)}>
                    {formatLocalizedNote(p.notes, lang)}
                  </Td>
                  <Td className="text-xs font-bold whitespace-nowrap">
                    {isRefund ? (
                      <span className="text-danger">
                        - {formatIDR(Math.abs(numAmount))} ({t('booking.refund')})
                      </span>
                    ) : (
                      <span className="text-success">
                        + {formatIDR(numAmount)}
                      </span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {canManage ? (
                      <div className="flex items-center gap-2">
                        {onEditPayment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditPayment(p)}
                          >
                            ✏️ {t('common.edit')}
                          </Button>
                        )}
                        {onDeletePayment && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDeletePayment(p)}
                          >
                            🗑️ {t('booking.deletePaymentBtn')}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-stone/40 px-2 py-1 rounded-md"
                        title={t('booking.managerOnlyAction')}
                      >
                        <span>🔒</span>
                        <span>{t('booking.managerOnlyAction')}</span>
                      </span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
};
