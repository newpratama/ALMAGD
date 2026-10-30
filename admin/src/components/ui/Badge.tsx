import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'gold' | 'navy';
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  style,
  title,
}) => {
  const variantStyles = {
    default: 'bg-stone text-muted',
    success: 'bg-success/15 text-success',
    danger: 'bg-danger/15 text-danger',
    warning: 'bg-gold/15 text-gold-text',
    info: 'bg-navy/10 text-navy',
    gold: 'bg-gold text-white',
    navy: 'bg-navy text-white',
  }[variant];

  return (
    <span
      style={style}
      title={title}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
