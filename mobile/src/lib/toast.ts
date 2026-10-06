type Listener = (message: string) => void;

const listeners = new Set<Listener>();

/** Dispara um toast global. Pode ser chamado de qualquer lugar, inclusive fora de componentes React (ex: lib/sync.ts). */
export function showToast(message: string): void {
  listeners.forEach((listener) => listener(message));
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
