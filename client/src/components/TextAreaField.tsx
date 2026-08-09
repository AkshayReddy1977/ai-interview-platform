import { TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <textarea
          id={inputId}
          ref={ref}
          className={clsx(
            'rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error ? 'border-red-400' : 'border-slate-300',
            className
          )}
          {...rest}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';
