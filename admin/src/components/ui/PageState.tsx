import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import type { ApiStateStatus } from "../../lib/useApiState";

interface PageStateProps {
  status: ApiStateStatus;
  error?: string | null;
  retry?: () => void;
  emptyTitle?: string;
  emptyHint?: string;
  children: ReactNode;
}

export function PageState({ status, error, retry, emptyTitle, emptyHint, children }: PageStateProps) {
  if (status === "loading") {
    return (
      <div className="empty-state">
        <div className="spinner" />
        <span>carregando...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="empty-state">
        <AlertTriangle size={28} color="var(--color-clay-600)" />
        <h3>Nao foi possivel carregar os dados</h3>
        <p>{error}</p>
        {retry ? (
          <button className="btn btn--ghost" onClick={retry} type="button">
            Tentar novamente
          </button>
        ) : null}
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="empty-state">
        <Inbox size={28} color="var(--color-ink-300)" />
        <h3>{emptyTitle ?? "Nada por aqui ainda"}</h3>
        {emptyHint ? <p>{emptyHint}</p> : null}
      </div>
    );
  }

  return <>{children}</>;
}
