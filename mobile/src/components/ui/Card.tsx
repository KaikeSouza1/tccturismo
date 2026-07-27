import type { HTMLAttributes } from "react";
import "./Card.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className, children, ...rest }: CardProps) {
  const classes = ["card", interactive ? "card--interactive" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
