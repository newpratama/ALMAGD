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
              <Th>{t('booking.dueDate')}</Th>
              <Th>{t('booking.method')}</Th>
              <Th>{t('booking.reference')}</Th>
              <Th>{t('booking.notes')}</Th>
              <Th>{t('booking.amount')}</Th>
              {canManage && <Th>{t('common.actions')}</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {payments.map((p) => {
              const numAmount = Number(p.amount);
              const isRefund = numAmount < 0;

              return (
                <Tr key={p.id}>
                  <Td className="text-xs text-muted">
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
                  <Td className="text-xs text-muted max-w-xs truncate">
                    {p.notes || '—'}
                  </Td>
                  <Td className="text-xs font-bold">
                    {isRefund ? (
                      <span className="text-danger">
                        - {formatIDR(Math.abs(numAmount))} (Refund)
                      </span>
                    ) : (
                      <span className="text-success">
                        + {formatIDR(numAmount)}
                      </span>
                    )}
                  </Td>
                  {canManage && (
                    <Td>
                      <div className="flex items-center gap-2">
                        {onEditPayment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditPayment(p)}
                          >
                            {t('common.edit')}
                          </Button>
                        )}
                        {onDeletePayment && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDeletePayment(p)}
                          >
                            {t('common.delete')}
                          </Button>
                        )}
                      </div>
                    </Td>
                  )}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
};
