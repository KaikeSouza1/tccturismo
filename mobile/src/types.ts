export interface User {
  id: string;
  name: string;
  email: string;
  role: "tourist" | "admin";
  points: number;
  createdAt: string;
}

export interface Attraction {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  hasImage: boolean;
  active: boolean;
}

export interface Visit {
  id: string;
  attractionId: string;
  attractionName: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  clientRecordedAt: string;
  createdAt: string;
}

export type AchievementCriteriaType =
  | "attractions_visited_count"
  | "specific_attractions"
  | "all_attractions"
  | "category_complete"
  | "points_total"
  | "distinct_categories_count"
  | "distinct_organizations_count";

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  points: number;
  criteriaType: AchievementCriteriaType;
  criteriaValue: Record<string, unknown>;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  points: number;
  achievementsCount: number;
}

export interface PendingVisit {
  localId: string;
  qrToken: string;
  latitude: number;
  longitude: number;
  clientRecordedAt: string;
  attractionNameGuess?: string;
}
