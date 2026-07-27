import { query } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type { AchievementCriteriaType, AchievementRecord } from "../../types";
import { MAX_ACHIEVEMENTS_PER_ORGANIZATION } from "./achievement-icons";
import { ORG_CRITERIA_TYPES } from "./achievements.validation";

interface AchievementInput {
  name: string;
  description?: string;
  icon: string;
  points: number;
  criteriaType: (typeof ORG_CRITERIA_TYPES)[number];
  criteriaValue: Record<string, unknown>;
}

type AchievementWithOrg = AchievementRecord & { organization_name: string | null };

function toPublicAchievement(achievement: AchievementWithOrg, unlockedAt: Date | null = null) {
  return {
    id: achievement.id,
    code: achievement.code,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    points: achievement.points,
    criteriaType: achievement.criteria_type,
    criteriaValue: achievement.criteria_value,
    organizationId: achievement.organization_id,
    organizationName: achievement.organization_name,
    unlocked: unlockedAt !== null,
    unlockedAt,
  };
}

export async function listAchievementsForUser(userId: string) {
  const result = await query<AchievementWithOrg & { unlocked_at: Date | null }>(
    `SELECT a.*, o.name AS organization_name, ua.unlocked_at
     FROM achievements a
     LEFT JOIN organizations o ON o.id = a.organization_id
     LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = $1
     ORDER BY a.organization_id NULLS FIRST, a.points ASC, a.name ASC`,
    [userId]
  );
  return result.rows.map((row) => toPublicAchievement(row, row.unlocked_at));
}

export async function listFixedAchievements() {
  const result = await query<AchievementWithOrg>(
    `SELECT a.*, NULL::text AS organization_name
     FROM achievements a
     WHERE a.organization_id IS NULL
     ORDER BY a.points ASC, a.name ASC`
  );
  return result.rows.map((row) => toPublicAchievement(row));
}

export async function listAchievementsForAdmin(organizationId: string) {
  const result = await query<AchievementWithOrg>(
    `SELECT a.*, o.name AS organization_name
     FROM achievements a
     LEFT JOIN organizations o ON o.id = a.organization_id
     WHERE a.organization_id IS NULL OR a.organization_id = $1
     ORDER BY a.organization_id NULLS FIRST, a.points ASC, a.name ASC`,
    [organizationId]
  );
  return result.rows.map((row) => toPublicAchievement(row));
}

async function assertCriteriaValueIsValid(
  organizationId: string,
  criteriaType: AchievementCriteriaType,
  criteriaValue: Record<string, unknown>
) {
  if (criteriaType === "attractions_visited_count") {
    const count = Number(criteriaValue.count);
    if (!Number.isInteger(count) || count < 1) {
      throw ApiError.badRequest("criteriaValue.count deve ser um numero inteiro maior que zero");
    }
    return;
  }

  if (criteriaType === "all_attractions") {
    return;
  }

  if (criteriaType === "category_complete") {
    const category = criteriaValue.category;
    if (typeof category !== "string" || category.trim().length === 0) {
      throw ApiError.badRequest("criteriaValue.category e obrigatorio");
    }
    const exists = await query(
      "SELECT 1 FROM attractions WHERE organization_id = $1 AND category = $2 LIMIT 1",
      [organizationId, category]
    );
    if (!exists.rowCount) {
      throw ApiError.badRequest("Nenhum atrativo da sua organizacao usa essa categoria");
    }
    return;
  }

  if (criteriaType === "specific_attractions") {
    const attractionIds = criteriaValue.attractionIds;
    if (!Array.isArray(attractionIds) || attractionIds.length === 0) {
      throw ApiError.badRequest("criteriaValue.attractionIds deve ser uma lista nao vazia");
    }
    const owned = await query<{ id: string }>(
      "SELECT id FROM attractions WHERE organization_id = $1 AND id = ANY($2::uuid[])",
      [organizationId, attractionIds]
    );
    if (owned.rowCount !== attractionIds.length) {
      throw ApiError.badRequest("Um ou mais atrativos informados nao pertencem a sua organizacao");
    }
    return;
  }
}

export async function createOrganizationAchievement(
  organizationId: string,
  input: AchievementInput
) {
  await assertCriteriaValueIsValid(organizationId, input.criteriaType, input.criteriaValue);

  const countResult = await query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM achievements WHERE organization_id = $1",
    [organizationId]
  );
  if (Number(countResult.rows[0].count) >= MAX_ACHIEVEMENTS_PER_ORGANIZATION) {
    throw ApiError.badRequest(
      `Sua organizacao ja atingiu o limite de ${MAX_ACHIEVEMENTS_PER_ORGANIZATION} conquistas proprias`
    );
  }

  const code = `org_${organizationId.slice(0, 8)}_${Date.now().toString(36)}`;

  const result = await query<AchievementRecord>(
    `INSERT INTO achievements (organization_id, code, name, description, icon, criteria_type, criteria_value, points)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      organizationId,
      code,
      input.name,
      input.description ?? null,
      input.icon,
      input.criteriaType,
      input.criteriaValue,
      input.points,
    ]
  );
  return toPublicAchievement({ ...result.rows[0], organization_name: null });
}

async function getOwnedOrganizationAchievement(organizationId: string, achievementId: string) {
  const result = await query<AchievementRecord>(
    "SELECT * FROM achievements WHERE id = $1 AND organization_id = $2",
    [achievementId, organizationId]
  );
  const achievement = result.rows[0];
  if (!achievement) {
    throw ApiError.notFound("Conquista nao encontrada na sua organizacao");
  }
  return achievement;
}

export async function updateOrganizationAchievement(
  organizationId: string,
  achievementId: string,
  input: Partial<AchievementInput>
) {
  const current = await getOwnedOrganizationAchievement(organizationId, achievementId);

  const criteriaType = input.criteriaType ?? current.criteria_type;
  const criteriaValue = input.criteriaValue ?? current.criteria_value;
  await assertCriteriaValueIsValid(organizationId, criteriaType, criteriaValue);

  const result = await query<AchievementRecord>(
    `UPDATE achievements SET
       name = $1, description = $2, icon = $3, criteria_type = $4, criteria_value = $5, points = $6
     WHERE id = $7
     RETURNING *`,
    [
      input.name ?? current.name,
      input.description ?? current.description,
      input.icon ?? current.icon,
      criteriaType,
      criteriaValue,
      input.points ?? current.points,
      achievementId,
    ]
  );
  return toPublicAchievement({ ...result.rows[0], organization_name: null });
}

export async function deleteOrganizationAchievement(organizationId: string, achievementId: string) {
  await getOwnedOrganizationAchievement(organizationId, achievementId);
  await query("DELETE FROM achievements WHERE id = $1", [achievementId]);
}

export async function getLeaderboard(limit = 20) {
  const result = await query<{
    id: string;
    name: string;
    points: number;
    achievements_count: string;
  }>(
    `SELECT u.id, u.name, u.points, COUNT(ua.id)::text AS achievements_count
     FROM users u
     LEFT JOIN user_achievements ua ON ua.user_id = u.id
     WHERE u.role = 'tourist'
     GROUP BY u.id
     ORDER BY u.points DESC, u.name ASC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    name: row.name,
    points: row.points,
    achievementsCount: Number(row.achievements_count),
  }));
}
