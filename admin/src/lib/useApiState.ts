import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";

export type ApiStateStatus = "loading" | "error" | "empty" | "ready";

export interface ApiState<T> {
  status: ApiStateStatus;
  data: T | null;
  error: string | null;
  retry: () => void;
}

/**
 * Busca dados de forma segura: sempre captura falha de rede/servidor (nunca
 * confunde "sem dado" com "erro"), e expoe retry() para tentar de novo sem
 * recarregar a tela inteira.
 */
export function useApiState<T>(
  fetcher: () => Promise<T>,
  isEmpty: (data: T) => boolean,
  deps: unknown[]
): ApiState<T> {
  const [status, setStatus] = useState<ApiStateStatus>("loading");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    setStatus("loading");
    setError(null);
    fetcher()
      .then((result) => {
        setData(result);
        setStatus(isEmpty(result) ? "empty" : "ready");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Nao foi possivel conectar ao servidor.");
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  useEffect(() => {
    load();
  }, [load]);

  return { status, data, error, retry: () => setAttempt((n) => n + 1) };
}
