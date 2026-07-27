import type { ReactNode } from "react";
import { X } from "lucide-react";
import "./Modal.css";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ title, onClose, children, width = 560 }: ModalProps) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: width }}>
        <header className="modal__header">
          <h2>{title}</h2>
          <button className="modal__close" onClick={onClose} type="button" aria-label="Fechar">
            <X size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
