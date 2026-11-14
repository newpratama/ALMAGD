import React from 'react';
import { DateInput } from './DateInput';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, type, ...props }, ref) => {
    if (type === 'date') {
      return <DateInput ref={ref} className={className} error={error} {...props} />;
    }

    const widthClass = /\bw-/.test(className) ? '' : 'w-full';

    return (
      <input
        ref={ref}
        type={type}
        className={`block ${widthClass} rounded-lg border bg-white px-3 py-2 text-sm text-ink text-start shadow-sm transition placeholder:text-muted/60 focus:outline-none focus:ring-1 ${
          error
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-line focus:border-navy focus:ring-navy'
        } disabled:bg-stone/50 disabled:text-muted ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
