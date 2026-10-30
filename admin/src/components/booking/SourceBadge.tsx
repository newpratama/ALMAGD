import React from 'react';

export interface SourceBadgeProps {
  label: string | null | undefined;
  color?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ label, color = '#536275' }) => {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white tracking-wide"
      style={{ backgroundColor: color }}
    >
      {label || '—'}
    </span>
  );
};
