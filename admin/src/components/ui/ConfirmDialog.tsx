import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  danger,
  onConfirm,
  onCancel,
  busy,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} width={420}>
      <p style={{ color: "var(--color-ink-700)", marginTop: 0 }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button className="btn btn--ghost" onClick={onCancel} type="button" disabled={busy}>
          Cancelar
        </button>
        <button
          className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
          onClick={onConfirm}
          type="button"
          disabled={busy}
        >
          {busy ? "aguarde..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
