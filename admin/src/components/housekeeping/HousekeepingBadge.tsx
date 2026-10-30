import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import {
  HousekeepingStatus,
  getUnitHousekeeping,
  cycleHousekeepingStatus,
} from '../../lib/housekeeping';

interface HousekeepingBadgeProps {
  unitId: number;
  interactive?: boolean;
  size?: 'sm' | 'md';
}

export const HousekeepingBadge: React.FC<HousekeepingBadgeProps> = ({
  unitId,
  interactive = true,
  size = 'sm',
}) => {
  const { t } = useI18n();
  const [status, setStatus] = useState<HousekeepingStatus>(() => getUnitHousekeeping(unitId));

  useEffect(() => {
    const handleUpdate = () => {
      setStatus(getUnitHousekeeping(unitId));
    };
    window.addEventListener('almagd-housekeeping-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('almagd-housekeeping-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [unitId]);

  const handleToggle = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    const next = cycleHousekeepingStatus(unitId);
    setStatus(next);
  };

  const config = {
    clean: {
      icon: '✨',
      label: t('housekeeping.clean'),
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    },
    cleaning: {
      icon: '🧼',
      label: t('housekeeping.cleaning'),
      bg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    },
    dirty: {
      icon: '🧹',
      label: t('housekeeping.dirty'),
      bg: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
    },
  }[status];

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!interactive}
      title={interactive ? t('housekeeping.clickToChange') : undefined}
      className={`inline-flex items-center gap-1 font-semibold rounded-full border transition-all ${
        config.bg
      } ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </button>
  );
};
