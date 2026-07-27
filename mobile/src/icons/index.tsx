import type { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function base(props: IconProps) {
  const { size = 24, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2l-2 5.6-5.6 2 2-5.6 5.6-2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ScanIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M4 16v2a2 2 0 0 0 2 2h2" />
      <path d="M20 8V6a2 2 0 0 0-2-2h-2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M4 12h16" strokeDasharray="1 3.2" />
    </svg>
  );
}

export function MedalIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8.5 3h7l-2.3 6.4h-2.4L8.5 3z" fill="currentColor" stroke="none" opacity={0.25} />
      <path d="M8.5 3h7l-2.3 6.4h-2.4L8.5 3z" />
      <circle cx="12" cy="15" r="6" />
      <path d="M12 11.7l1 2.2 2.4.3-1.7 1.7.4 2.4-2.1-1.2-2.1 1.2.4-2.4-1.7-1.7 2.4-.3 1-2.2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4.5A2.5 2.5 0 0 0 5 9.9" />
      <path d="M17 5h2.5A2.5 2.5 0 0 1 19 9.9" />
      <path d="M12 13v3" />
      <path d="M8.5 20.5h7" />
      <path d="M9.5 16.8h5l.6 3.7h-6.2l.6-3.7z" fill="currentColor" stroke="none" opacity={0.2} />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c1-3.6 4-5.6 7-5.6s6 2 7 5.6" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3v18" />
      <path d="M6 4.5h12l-3 3.5 3 3.5H6" fill="currentColor" stroke="none" opacity={0.22} />
      <path d="M6 4.5h12l-3 3.5 3 3.5H6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M14 12H4" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M12 3l1.4 5.3L18.7 9.7l-5.3 1.4L12 16.4l-1.4-5.3L5.3 9.7l5.3-1.4L12 3z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="5.5" cy="18" r="2" />
      <circle cx="18.5" cy="6" r="2" />
      <path d="M7.3 17c4-1 3-6 3-8s2-3.6 4-3.6" strokeDasharray="0.2 4.2" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}
