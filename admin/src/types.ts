export interface User {
  id: string;
  name: string;
  email: string;
  role: "tourist" | "admin" | "platform_admin";
  organizationId: string | null;
  organizationName: string | null;
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
  organizationId: string | null;
  organizationName: string | null;
}

export interface Visit {
  id: string;
  attractionId: string;
  attractionName: string;
  touristName: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  clientRecordedAt: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalVisits: number;
  totalTourists: number;
  totalAttractions: number;
  visitsToday: number;
}

export interface VisitsByAttraction {
  attractionId: string;
  attractionName: string;
  visitCount: number;
}

export interface VisitsOverTimePoint {
  date: string;
  visitCount: number;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  attractionName: string;
  weight: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  adminEmail: string | null;
  attractionsCount: number;
}

export const CATEGORY_LABEL: Record<string, string> = {
  cultural: "Cultural",
  historico: "Historico",
  natureza: "Natureza",
  lazer: "Lazer",
};
