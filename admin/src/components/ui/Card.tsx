import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-line shadow-sm p-4 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
