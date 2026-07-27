import type { ReactNode } from "react";
import "./InkStamp.css";

interface InkStampProps {
  variant?: "ink" | "success" | "locked" | "amber" | "impact" | "bronze" | "silver" | "gold" | "legendary";
  size?: number;
  rotate?: number;
  label?: string;
  children?: ReactNode;
}

export function InkStamp({ variant = "ink", size = 74, rotate = -8, label, children }: InkStampProps) {
  return (
    <div
      className={`stamp stamp--${variant}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
    >
      <div className="stamp__ring">
        <div className="stamp__inner">
          {children}
          {label ? <span className="stamp__label">{label}</span> : null}
        </div>
      </div>
    </div>
  );
}
