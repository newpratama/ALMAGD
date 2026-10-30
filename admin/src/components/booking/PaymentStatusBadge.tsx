import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Badge } from '../ui/Badge';

export interface PaymentStatusBadgeProps {
  status: string | null | undefined;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  const { t } = useI18n();

  const variant = (() => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unpaid':
        return 'danger';
      case 'refund_due':
        return 'gold';
      default:
        return 'default';
    }
  })();

  const labelKey = status ? `paymentStatus.${status}` : 'paymentStatus.unpaid';
  return <Badge variant={variant}>{t(labelKey)}</Badge>;
};
