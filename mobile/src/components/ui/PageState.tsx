import type { ReactNode } from "react";
import { JournalCard } from "./JournalCard";
import { InkStamp } from "./InkStamp";
import { Button } from "./Button";
import { LockIcon } from "../../icons";
import "./PageState.css";

interface PageStateProps {
  status: "loading" | "error" | "empty";
  emptyMessage?: string;
  errorMessage?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  skeletonCount?: number;
}

function SkeletonCard() {
  return (
    <JournalCard tornEdge="top" tilt={0} className="page-skeleton">
      <div className="page-skeleton__row">
        <div className="page-skeleton__thumb shimmer" />
        <div className="page-skeleton__lines">
          <div className="page-skeleton__line shimmer" style={{ width: "70%" }} />
          <div className="page-skeleton__line shimmer" style={{ width: "90%" }} />
          <div className="page-skeleton__line shimmer" style={{ width: "45%" }} />
        </div>
      </div>
    </JournalCard>
  );
}

export function PageState({
  status,
  emptyMessage = "nada por aqui ainda.",
  errorMessage = "Nao foi possivel conectar ao servidor.",
  icon,
  onRetry,
  skeletonCount = 3,
}: PageStateProps) {
  if (status === "loading") {
    return (
      <div className="page-state page-state--loading">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page-state page-state--message">
        <InkStamp variant="locked" size={64} rotate={-6}>
          <LockIcon size={22} />
        </InkStamp>
        <p className="page-state__text">{errorMessage}</p>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Tentar de novo
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="page-state page-state--message">
      {icon ?? (
        <InkStamp variant="locked" size={64} rotate={6}>
          <LockIcon size={22} />
        </InkStamp>
      )}
      <p className="page-state__text page-state__text--hand">{emptyMessage}</p>
    </div>
  );
}
