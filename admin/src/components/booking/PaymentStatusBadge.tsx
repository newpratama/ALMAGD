import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Badge } from '../ui/Badge';
import { isOtaSource } from '../../lib/bookingHelpers';

export interface PaymentStatusBadgeProps {
  status: string | null | undefined;
  sourceCode?: string | null | undefined;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, sourceCode }) => {
  const { t } = useI18n();

  const isOta = isOtaSource(sourceCode);

  // If from OTA and status is unpaid, the guest actually prepaid via app, payout expected on check-in
  if (isOta && (status === 'unpaid' || !status)) {
    return (
      <Badge variant="navy" className="text-[10px] whitespace-nowrap">
        📱 {t('paymentStatus.otaPrepaid')}
      </Badge>
    );
  }

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
