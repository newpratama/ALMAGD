import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`text-center py-12 px-4 rounded-xl border border-dashed border-line bg-white/50 flex flex-col items-center justify-center ${className}`}
    >
      {icon ? (
        <div className="mb-3 text-muted">{icon}</div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-stone flex items-center justify-center text-muted mb-3 font-bold text-lg">
          ∅
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
