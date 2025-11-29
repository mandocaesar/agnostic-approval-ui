/**
 * Form Input Components with Validation
 * Provides accessible, validated form inputs
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Text Input Component
 *
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   error={errors.email}
 *   hint="We'll never share your email"
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = "",
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="ml-1 text-rose-500" aria-label="required">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={`
              block w-full rounded-lg border px-4 py-2 text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-1
              disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${
                error
                  ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500"
              }
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={`${error ? errorId : ""} ${hint ? hintId : ""}`.trim() || undefined}
            {...props}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="mt-1.5 flex items-center gap-1 text-xs text-rose-600" role="alert">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * Textarea Component
 */
export const Textarea = forwardRef<HTMLTextAreaElement, {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  rows?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      rows = 4,
      className = "",
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="ml-1 text-rose-500" aria-label="required">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          rows={rows}
          className={`
            block w-full rounded-lg border px-4 py-2 text-sm transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            ${
              error
                ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500"
            }
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ""} ${hint ? hintId : ""}`.trim() || undefined}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="mt-1.5 flex items-center gap-1 text-xs text-rose-600" role="alert">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

/**
 * Select Component
 */
export const Select = forwardRef<HTMLSelectElement, {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      options,
      placeholder,
      className = "",
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="ml-1 text-rose-500" aria-label="required">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          className={`
            block w-full rounded-lg border px-4 py-2 text-sm transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            ${
              error
                ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500"
            }
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ""} ${hint ? hintId : ""}`.trim() || undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="mt-1.5 flex items-center gap-1 text-xs text-rose-600" role="alert">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

/**
 * Checkbox Component
 */
export const Checkbox = forwardRef<HTMLInputElement, {
  label?: string;
  description?: string;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ label, description, error, className = "", disabled, id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;

    return (
      <div>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            disabled={disabled}
            className={`
              mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? "border-rose-300" : ""}
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />

          <div className="flex-1">
            {label && (
              <label
                htmlFor={inputId}
                className={`block text-sm font-medium ${disabled ? "text-slate-400" : "text-slate-700"}`}
              >
                {label}
              </label>
            )}

            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>

        {error && (
          <p id={errorId} className="mt-1.5 flex items-center gap-1 text-xs text-rose-600" role="alert">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

/**
 * Form Group Component
 */
export function FormGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}
