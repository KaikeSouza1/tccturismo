export type UserRole = "tourist" | "admin" | "platform_admin";

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  organization_id: string | null;
  points: number;
  created_at: Date;
  updated_at: Date;
}

export interface AttractionRecord {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  qr_code_token: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VisitRecord {
  id: string;
  user_id: string;
  attraction_id: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  photo_key: string | null;
  client_recorded_at: Date;
  synced_at: Date;
  created_at: Date;
}

export type AchievementCriteriaType =
  | "attractions_visited_count"
  | "specific_attractions"
  | "all_attractions"
  | "category_complete"
  | "points_total"
  | "distinct_categories_count"
  | "distinct_organizations_count";

export interface AchievementRecord {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  criteria_type: AchievementCriteriaType;
  criteria_value: Record<string, unknown>;
  points: number;
  created_at: Date;
}

export interface UserAchievementRecord {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: Date;
}
