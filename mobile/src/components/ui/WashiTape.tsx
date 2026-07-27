import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { haptics } from "../../lib/haptics";
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
  interactive?: boolean;
  onReveal?: () => void;
  children?: ReactNode;
}

const REVEAL_THRESHOLD = 40;

export function WashiTape({
  color = "blue",
  pattern = "solid",
  rotate = -4,
  width = 92,
  top,
  left,
  right,
  style,
  interactive = false,
  onReveal,
  children,
}: WashiTapeProps) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [peeled, setPeeled] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const revealedRef = useRef(false);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!interactive || peeled) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    revealedRef.current = false;
    setDragging(true);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    setDrag({ x: dx, y: dy });

    const distance = Math.hypot(dx, dy);
    if (distance > REVEAL_THRESHOLD && !revealedRef.current) {
      revealedRef.current = true;
      haptics.light();
    }
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (revealedRef.current) {
      setPeeled(true);
      onReveal?.();
    } else {
      setDrag({ x: 0, y: 0 });
    }
  }

  const baseTransform = `rotate(${rotate}deg)`;
  const transform = peeled
    ? `translate(70px, -46px) rotate(${rotate - 34}deg)`
    : dragging
      ? `translate(${drag.x}px, ${drag.y}px) ${baseTransform}`
      : baseTransform;

  return (
    <div
      className={`washi washi--${color} washi--${pattern} ${interactive ? "washi--interactive" : ""} ${
        dragging ? "washi--dragging" : ""
      }`}
      style={{ width, top, left, right, transform, ...style }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children}
    </div>
  );
}
