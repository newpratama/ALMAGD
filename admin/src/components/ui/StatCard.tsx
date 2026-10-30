import React from 'react';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'gold' | 'navy' | 'success' | 'danger';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  className = '',
}) => {
  const iconBg = {
    default: 'bg-stone text-muted',
    gold: 'bg-gold/15 text-gold-text',
    navy: 'bg-navy/10 text-navy',
    success: 'bg-success/15 text-success',
    danger: 'bg-danger/15 text-danger',
  }[variant];

  return (
    <div
      className={`bg-white rounded-xl border border-line shadow-sm p-4 sm:p-5 flex items-start justify-between gap-4 text-start ${className}`}
    >
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-medium text-muted">{title}</p>
        <p className="text-xl sm:text-2xl font-bold tracking-tight text-ink">{value}</p>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {icon && (
        <div className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      )}
    </div>
  );
};
