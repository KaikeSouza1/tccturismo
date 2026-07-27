import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  fullWidth?: boolean;
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth,
  icon,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = ["btn", `btn--${variant}`, fullWidth ? "btn--full" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="btn__spinner" aria-hidden /> : icon}
      <span>{children}</span>
    </button>
  );
}
