import { useEffect, useState } from "react";
import { subscribeToast } from "../../lib/toast";
import "./ToastHost.css";

interface ToastItem {
  id: string;
  message: string;
}

const AUTO_DISMISS_MS = 6000;

/** Monta uma vez (em AppShell) e escuta showToast() de qualquer lugar do app. */
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToast((message) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, AUTO_DISMISS_MS);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast-host__item">
          {t.message}
        </div>
      ))}
    </div>
  );
}
