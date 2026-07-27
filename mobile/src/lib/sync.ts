import { apiRequest } from "./api";
import { getPendingVisits, removePendingVisit } from "./offline-queue";
import type { Achievement, Visit } from "../types";

interface SyncResult {
  syncedCount: number;
  failedCount: number;
  unlockedAchievements: Achievement[];
}

export async function syncPendingVisits(token: string): Promise<SyncResult> {
  const pending = await getPendingVisits();
  let syncedCount = 0;
  let failedCount = 0;
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
    } catch {
      failedCount += 1;
    }
  }

  return { syncedCount, failedCount, unlockedAchievements };
}
