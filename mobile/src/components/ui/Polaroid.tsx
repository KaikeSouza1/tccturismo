import type { ReactNode } from "react";
import "./Polaroid.css";

interface PolaroidProps {
  tilt?: number;
  caption?: string;
  size?: number;
  className?: string;
  photoClassName?: string;
  children: ReactNode;
}

export function Polaroid({ tilt = -3, caption, size = 92, className, photoClassName, children }: PolaroidProps) {
  return (
    <div
      className={["polaroid", className].filter(Boolean).join(" ")}
      style={{ transform: `rotate(${tilt}deg)`, width: size }}
    >
      <div className={["polaroid__photo", photoClassName].filter(Boolean).join(" ")} style={{ height: size }}>
        {children}
      </div>
      {caption ? <span className="polaroid__caption">{caption}</span> : null}
    </div>
  );
}
