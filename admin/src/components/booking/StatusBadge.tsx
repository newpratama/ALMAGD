import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Badge } from '../ui/Badge';

export interface StatusBadgeProps {
  status: string | null | undefined;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'confirmed' }) => {
  const { t } = useI18n();
  const safeStatus = status || 'confirmed';

  const variant = (() => {
    switch (safeStatus) {
      case 'confirmed':
        return 'success';
      case 'checked_in':
        return 'navy';
      case 'checked_out':
        return 'default';
      case 'cancelled':
        return 'danger';
      case 'no_show':
        return 'warning';
      default:
        return 'default';
    }
  })();

  const labelKey = `status.${safeStatus}`;
  return <Badge variant={variant}>{t(labelKey)}</Badge>;
};
