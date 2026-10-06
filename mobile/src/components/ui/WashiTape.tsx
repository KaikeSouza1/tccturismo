import type { CSSProperties, ReactNode } from "react";
import "./WashiTape.css";

interface WashiTapeProps {
  color?: "blue" | "kraft" | "clay" | "trail";
  pattern?: "solid" | "stripe" | "dot";
  rotate?: number;
  width?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function WashiTape({
  color = "blue",
  pattern = "solid",
  rotate = -4,
  width = 92,
  top,
  left,
  right,
  style,
  children,
}: WashiTapeProps) {
  return (
    <div
      className={`washi washi--${color} washi--${pattern}`}
      style={{ width, top, left, right, transform: `rotate(${rotate}deg)`, ...style }}
    >
      {children}
    </div>
  );
}
