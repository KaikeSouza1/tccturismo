import { Preferences } from "@capacitor/preferences";
import type { Attraction, PendingVisit } from "../types";

const ATTRACTIONS_CACHE_KEY = "trilha_local_attractions_cache";
const PENDING_VISITS_KEY = "trilha_local_pending_visits";

export async function cacheAttractions(attractions: Attraction[]): Promise<void> {
  await Preferences.set({ key: ATTRACTIONS_CACHE_KEY, value: JSON.stringify(attractions) });
}

export async function getCachedAttractions(): Promise<Attraction[]> {
  const stored = await Preferences.get({ key: ATTRACTIONS_CACHE_KEY });
  if (!stored.value) return [];
  try {
    return JSON.parse(stored.value) as Attraction[];
  } catch {
    return [];
  }
}

export async function getPendingVisits(): Promise<PendingVisit[]> {
  const stored = await Preferences.get({ key: PENDING_VISITS_KEY });
  if (!stored.value) return [];
  try {
    return JSON.parse(stored.value) as PendingVisit[];
  } catch {
    return [];
  }
}

async function savePendingVisits(visits: PendingVisit[]): Promise<void> {
  await Preferences.set({ key: PENDING_VISITS_KEY, value: JSON.stringify(visits) });
}

export async function enqueuePendingVisit(visit: PendingVisit): Promise<void> {
  const current = await getPendingVisits();
  current.push(visit);
  await savePendingVisits(current);
}

export async function removePendingVisit(localId: string): Promise<void> {
  const current = await getPendingVisits();
  await savePendingVisits(current.filter((v) => v.localId !== localId));
}
