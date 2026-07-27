import { z } from "zod";
import { ACHIEVEMENT_ICONS } from "./achievement-icons";

/**
 * Organizacoes so podem usar criterios cujo universo (atrativos) pode ser
 * restrito a elas mesmas pela engine. Criterios globais (points_total,
 * distinct_categories_count, distinct_organizations_count) ficam exclusivos
 * das 10 conquistas fixas da plataforma.
 */
export const ORG_CRITERIA_TYPES = [
  "attractions_visited_count",
  "specific_attractions",
  "all_attractions",
  "category_complete",
] as const;

const baseAchievementSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  icon: z.enum(ACHIEVEMENT_ICONS),
  points: z.number().int().min(0).max(1000),
  criteriaType: z.enum(ORG_CRITERIA_TYPES),
  criteriaValue: z.record(z.unknown()).default({}),
});

export const createAchievementSchema = baseAchievementSchema;
export const updateAchievementSchema = baseAchievementSchema.partial();
