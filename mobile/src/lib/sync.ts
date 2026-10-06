import { apiRequest, ApiError } from "./api";
import { getPendingVisits, removePendingVisit } from "./offline-queue";
import { showToast } from "./toast";
import type { Achievement, PendingVisit, Visit } from "../types";

interface SyncResult {
  syncedCount: number;
  failedCount: number;
  discardedMessages: string[];
  unlockedAchievements: Achievement[];
}

/**
 * 400 (fora do raio / payload invalido) e 404 (QR/atrativo inexistente ou
 * desativado) sao decisoes definitivas do servidor sobre aquele registro
 * especifico — nunca vao se resolver numa proxima tentativa, entao o item
 * sai da fila. Qualquer outra falha (sem rede, timeout, 5xx, 401/403 de
 * sessao expirada) e tratada como transitoria: o item fica na fila para a
 * proxima sincronizacao.
 */
function isDefinitiveFailure(err: unknown): err is ApiError {
  return err instanceof ApiError && (err.status === 400 || err.status === 404);
}

function discardMessage(visit: PendingVisit, err: ApiError): string {
  if (err.status === 404) {
    return `Visita descartada${visit.attractionNameGuess ? ` (${visit.attractionNameGuess})` : ""}: atrativo nao encontrado ou desativado.`;
  }
  return `Visita descartada${visit.attractionNameGuess ? ` (${visit.attractionNameGuess})` : ""}: ${err.message}`;
}

export async function syncPendingVisits(token: string): Promise<SyncResult> {
  const pending = await getPendingVisits();
  let syncedCount = 0;
  let failedCount = 0;
  const discardedMessages: string[] = [];
  const unlockedAchievements: Achievement[] = [];

  for (const visit of pending) {
    try {
      const result = await apiRequest<{ visit: Visit; unlockedAchievements: Achievement[] }>(
        "/visits",
        {
          method: "POST",
          token,
          body: {
            qrToken: visit.qrToken,
            latitude: visit.latitude,
            longitude: visit.longitude,
            clientRecordedAt: visit.clientRecordedAt,
          },
        }
      );
      unlockedAchievements.push(...result.unlockedAchievements);
      await removePendingVisit(visit.localId);
      syncedCount += 1;
    } catch (err) {
      if (isDefinitiveFailure(err)) {
        const message = discardMessage(visit, err);
        await removePendingVisit(visit.localId);
        discardedMessages.push(message);
        showToast(message);
      } else {
        failedCount += 1;
      }
      // continua processando os demais itens da fila independentemente do resultado deste
    }
  }

  return { syncedCount, failedCount, discardedMessages, unlockedAchievements };
}
