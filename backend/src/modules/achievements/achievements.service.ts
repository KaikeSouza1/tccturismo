import { query } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type { AchievementCriteriaType, AchievementRecord } from "../../types";
import { MAX_ACHIEVEMENTS_PER_ORGANIZATION } from "./achievement-icons";
import { ORG_CRITERIA_TYPES } from "./achievements.validation";
import { buildEvaluationContext, computeProgress, type AchievementProgress } from "./achievements.engine";

interface AchievementInput {
  name: string;
  description?: string;
  icon: string;
  points: number;
  criteriaType: (typeof ORG_CRITERIA_TYPES)[number];
  criteriaValue: Record<string, unknown>;
}

type AchievementWithOrg = AchievementRecord & { organization_name: string | null };

const ACHIEVEMENT_COLUMNS = `
  a.id, a.codigo AS code, a.nome AS name, a.descricao AS description, a.icone AS icon,
  a.tipo_criterio AS criteria_type, a.valor_criterio AS criteria_value, a.pontos AS points,
  a.criado_em AS created_at, a.organizacao_id AS organization_id
`;

const ACHIEVEMENT_RETURNING = `
  id, codigo AS code, nome AS name, descricao AS description, icone AS icon,
  tipo_criterio AS criteria_type, valor_criterio AS criteria_value, pontos AS points,
  criado_em AS created_at, organizacao_id AS organization_id
`;

function toPublicAchievement(
  achievement: AchievementWithOrg,
  unlockedAt: Date | null = null,
  progress?: AchievementProgress
) {
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
    // so calculado para conquistas ainda bloqueadas (ver listAchievementsForUser) —
    // depois de desbloqueada, "quanto falta" deixa de fazer sentido.
    progress: progress ?? null,
  };
}

export async function listAchievementsForUser(userId: string) {
  const result = await query<AchievementWithOrg & { unlocked_at: Date | null }>(
    `SELECT ${ACHIEVEMENT_COLUMNS}, o.nome AS organization_name, ua.desbloqueado_em AS unlocked_at
     FROM conquistas a
     LEFT JOIN organizacoes o ON o.id = a.organizacao_id
     LEFT JOIN usuario_conquistas ua ON ua.conquista_id = a.id AND ua.usuario_id = $1
     ORDER BY a.organizacao_id NULLS FIRST, a.pontos ASC, a.nome ASC`,
    [userId]
  );
  const ctx = await buildEvaluationContext(userId);
  return result.rows.map((row) =>
    toPublicAchievement(row, row.unlocked_at, row.unlocked_at ? undefined : computeProgress(row, ctx))
  );
}

export async function listFixedAchievements() {
  const result = await query<AchievementWithOrg>(
    `SELECT ${ACHIEVEMENT_COLUMNS}, NULL::text AS organization_name
     FROM conquistas a
     WHERE a.organizacao_id IS NULL
     ORDER BY a.pontos ASC, a.nome ASC`
  );
  return result.rows.map((row) => toPublicAchievement(row));
}

export async function listAchievementsForAdmin(organizationId: string) {
  const result = await query<AchievementWithOrg>(
    `SELECT ${ACHIEVEMENT_COLUMNS}, o.nome AS organization_name
     FROM conquistas a
     LEFT JOIN organizacoes o ON o.id = a.organizacao_id
     WHERE a.organizacao_id IS NULL OR a.organizacao_id = $1
     ORDER BY a.organizacao_id NULLS FIRST, a.pontos ASC, a.nome ASC`,
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
      "SELECT 1 FROM atrativos WHERE organizacao_id = $1 AND categoria = $2 LIMIT 1",
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
      "SELECT id FROM atrativos WHERE organizacao_id = $1 AND id = ANY($2::uuid[])",
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
    "SELECT COUNT(*)::text AS count FROM conquistas WHERE organizacao_id = $1",
    [organizationId]
  );
  if (Number(countResult.rows[0].count) >= MAX_ACHIEVEMENTS_PER_ORGANIZATION) {
    throw ApiError.badRequest(
      `Sua organizacao ja atingiu o limite de ${MAX_ACHIEVEMENTS_PER_ORGANIZATION} conquistas proprias`
    );
  }

  const code = `org_${organizationId.slice(0, 8)}_${Date.now().toString(36)}`;

  const result = await query<AchievementRecord>(
    `INSERT INTO conquistas (organizacao_id, codigo, nome, descricao, icone, tipo_criterio, valor_criterio, pontos)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${ACHIEVEMENT_RETURNING}`,
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
    `SELECT ${ACHIEVEMENT_RETURNING} FROM conquistas WHERE id = $1 AND organizacao_id = $2`,
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
    `UPDATE conquistas SET
       nome = $1, descricao = $2, icone = $3, tipo_criterio = $4, valor_criterio = $5, pontos = $6
     WHERE id = $7
     RETURNING ${ACHIEVEMENT_RETURNING}`,
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
  await query("DELETE FROM conquistas WHERE id = $1", [achievementId]);
}

export async function getLeaderboard(limit = 20) {
  const result = await query<{
    id: string;
    name: string;
    points: number;
    achievements_count: string;
  }>(
    `SELECT u.id, u.nome AS name, u.pontos AS points, COUNT(ua.id)::text AS achievements_count
     FROM usuarios u
     LEFT JOIN usuario_conquistas ua ON ua.usuario_id = u.id
     WHERE u.papel = 'tourist'
     GROUP BY u.id
     ORDER BY u.pontos DESC, u.nome ASC
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

export async function getOrganizationLeaderboard(organizationId: string, limit = 20) {
  const result = await query<{ id: string; name: string; visit_count: string }>(
    `SELECT u.id, u.nome AS name, COUNT(v.id)::text AS visit_count
     FROM usuarios u
     JOIN visitas v ON v.usuario_id = u.id
     JOIN atrativos a ON a.id = v.atrativo_id
     WHERE a.organizacao_id = $1 AND u.papel = 'tourist'
     GROUP BY u.id
     ORDER BY COUNT(v.id) DESC, u.nome ASC
     LIMIT $2`,
    [organizationId, limit]
  );

  return result.rows.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    name: row.name,
    visitsCount: Number(row.visit_count),
  }));
}
