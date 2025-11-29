/**
 * Reusable Button Components
 * Provides consistent styling, loading states, and accessibility
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Spinner } from "./loading";

export type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300",
  secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500 disabled:bg-slate-100 disabled:text-slate-400",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 disabled:bg-rose-300",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 disabled:bg-emerald-300",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500 disabled:text-slate-400",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

/**
 * Primary Button Component
 *
 * @example
 * <Button loading={saving} onClick={handleSave}>
 *   Save Changes
 * </Button>
 *
 * <Button variant="danger" leftIcon={<TrashIcon />}>
 *   Delete
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg font-medium
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="sm" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * Icon Button Component
 * For buttons with only an icon
 *
 * @example
 * <IconButton aria-label="Delete" onClick={handleDelete}>
 *   <TrashIcon />
 * </IconButton>
 */
export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    if (!ariaLabel && !loading) {
      console.warn("IconButton should have an aria-label for accessibility");
    }

    const sizeClasses = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        className={`
          inline-flex items-center justify-center rounded-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60
          ${variantStyles[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        aria-busy={loading}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

/**
 * Button Group Component
 * For grouping related buttons
 *
 * @example
 * <ButtonGroup>
 *   <Button variant="secondary">Cancel</Button>
 *   <Button variant="primary">Save</Button>
 * </ButtonGroup>
 */
export function ButtonGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`inline-flex gap-2 ${className}`} role="group">
      {children}
    </div>
  );
}

/**
 * Link Button Component
 * Styled like a button but behaves like a link
 *
 * @example
 * <LinkButton href="/approvals">
 *   View Approvals
 * </LinkButton>
 */
export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  children,
  ...props
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </a>
  );
}

/**
 * Submit Button Component
 * Automatically handles form submission state
 *
 * @example
 * <form onSubmit={handleSubmit}>
 *   <SubmitButton>Submit Form</SubmitButton>
 * </form>
 */
export const SubmitButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "type">>(
  ({ children, ...props }, ref) => {
    return (
      <Button ref={ref} type="submit" {...props}>
        {children}
      </Button>
    );
  }
);

SubmitButton.displayName = "SubmitButton";
