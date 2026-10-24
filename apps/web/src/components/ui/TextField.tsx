import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  error?: string;
  /** Helper content rendered under the input (e.g. a password checklist). */
  hint?: ReactNode;
  /** Element rendered inside the input on the right (e.g. a show/hide toggle). */
  trailing?: ReactNode;
}

/** Labelled input wired for accessibility: errors are announced and linked via aria-describedby. */
export function TextField({
  label,
  error,
  hint,
  trailing,
  id,
  className,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm transition outline-none',
            'placeholder:text-slate-400 focus:ring-2 dark:bg-slate-900',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30 dark:border-slate-700',
            trailing && 'pr-11',
            className,
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {hint && <div id={hintId}>{hint}</div>}
    </div>
  );
}
