import type { HTMLAttributes } from "react";
import "./JournalCard.css";

interface JournalCardProps extends HTMLAttributes<HTMLDivElement> {
  tilt?: number;
  tornEdge?: "top" | "both" | "none";
}

export function JournalCard({
  tilt = 0,
  tornEdge = "top",
  className,
  style,
  children,
  ...rest
}: JournalCardProps) {
  const classes = ["journal-card", `journal-card--torn-${tornEdge}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined, ...style }}
      {...rest}
    >
      <div className="journal-card__surface">{children}</div>
    </div>
  );
}
