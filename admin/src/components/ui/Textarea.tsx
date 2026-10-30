import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink text-start shadow-sm transition placeholder:text-muted/60 focus:outline-none focus:ring-1 ${
          error
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-line focus:border-navy focus:ring-navy'
        } disabled:bg-stone/50 disabled:text-muted ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
