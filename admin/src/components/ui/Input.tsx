import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    const widthClass = /\bw-/.test(className) ? '' : 'w-full';

    return (
      <input
        ref={ref}
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
