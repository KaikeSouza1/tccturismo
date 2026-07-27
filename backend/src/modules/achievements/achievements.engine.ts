import { query } from "../../config/db";
import type { AchievementCriteriaType, AchievementRecord } from "../../types";

interface EvaluationContext {
  distinctAttractionIds: Set<string>;
  distinctCategoriesVisited: Set<string>;
  distinctOrganizationsVisited: Set<string>;
  currentPoints: number;
  totalActiveAttractions: number;
  activeAttractionIdsByCategory: Map<string, Set<string>>;
  orgActiveAttractionIds: Map<string, Set<string>>;
  orgActiveAttractionIdsByCategory: Map<string, Map<string, Set<string>>>;
}

/**
 * Padrao Strategy (GAMMA et al., 1994): cada tipo de criterio de conquista
 * e avaliado por uma estrategia intercambiavel, permitindo adicionar novas
 * regras de gamificacao sem alterar a engine em si. Conquistas fixas da
 * plataforma (organization_id nulo) sao avaliadas com base em estatisticas
 * globais; conquistas criadas por uma organizacao sao restritas ao universo
 * de atrativos dessa organizacao.
 */
type CriteriaEvaluator = (
  criteriaValue: Record<string, unknown>,
  ctx: EvaluationContext,
  achievement: AchievementRecord
) => boolean;

const evaluators: Record<AchievementCriteriaType, CriteriaEvaluator> = {
  attractions_visited_count: (criteria, ctx, achievement) => {
    const target = Number(criteria.count ?? 0);
    if (achievement.organization_id) {
      const orgIds = ctx.orgActiveAttractionIds.get(achievement.organization_id) ?? new Set();
      const visitedInOrg = [...ctx.distinctAttractionIds].filter((id) => orgIds.has(id));
      return visitedInOrg.length >= target;
    }
    return ctx.distinctAttractionIds.size >= target;
  },
  specific_attractions: (criteria, ctx) => {
    const required = (criteria.attractionIds as string[] | undefined) ?? [];
    if (required.length === 0) return false;
    return required.every((id) => ctx.distinctAttractionIds.has(id));
  },
  all_attractions: (_criteria, ctx, achievement) => {
    if (achievement.organization_id) {
      const orgIds = ctx.orgActiveAttractionIds.get(achievement.organization_id);
      if (!orgIds || orgIds.size === 0) return false;
      return [...orgIds].every((id) => ctx.distinctAttractionIds.has(id));
    }
    if (ctx.totalActiveAttractions === 0) return false;
    return ctx.distinctAttractionIds.size >= ctx.totalActiveAttractions;
  },
  category_complete: (criteria, ctx, achievement) => {
    const category = criteria.category as string | undefined;
    if (!category) return false;
    const idsInCategory = achievement.organization_id
      ? ctx.orgActiveAttractionIdsByCategory.get(achievement.organization_id)?.get(category)
      : ctx.activeAttractionIdsByCategory.get(category);
    if (!idsInCategory || idsInCategory.size === 0) return false;
    return [...idsInCategory].every((id) => ctx.distinctAttractionIds.has(id));
  },
  points_total: (criteria, ctx) => {
    const target = Number(criteria.points ?? 0);
    return ctx.currentPoints >= target;
  },
  distinct_categories_count: (criteria, ctx) => {
    const target = Number(criteria.count ?? 0);
    return ctx.distinctCategoriesVisited.size >= target;
  },
  distinct_organizations_count: (criteria, ctx) => {
    const target = Number(criteria.count ?? 0);
    return ctx.distinctOrganizationsVisited.size >= target;
  },
};

async function buildEvaluationContext(userId: string): Promise<EvaluationContext> {
  const [visitsResult, attractionsResult, userResult] = await Promise.all([
    query<{ attraction_id: string }>(
      "SELECT DISTINCT attraction_id FROM visits WHERE user_id = $1",
      [userId]
    ),
    query<{ id: string; category: string | null; organization_id: string }>(
      "SELECT id, category, organization_id FROM attractions WHERE active = true"
    ),
    query<{ points: number }>("SELECT points FROM users WHERE id = $1", [userId]),
  ]);

  const attractionMeta = new Map<string, { category: string | null; organizationId: string }>();
  const activeAttractionIdsByCategory = new Map<string, Set<string>>();
  const orgActiveAttractionIds = new Map<string, Set<string>>();
  const orgActiveAttractionIdsByCategory = new Map<string, Map<string, Set<string>>>();

  for (const row of attractionsResult.rows) {
    attractionMeta.set(row.id, { category: row.category, organizationId: row.organization_id });

    if (row.category) {
      const set = activeAttractionIdsByCategory.get(row.category) ?? new Set<string>();
      set.add(row.id);
      activeAttractionIdsByCategory.set(row.category, set);
    }

    const orgSet = orgActiveAttractionIds.get(row.organization_id) ?? new Set<string>();
    orgSet.add(row.id);
    orgActiveAttractionIds.set(row.organization_id, orgSet);

    if (row.category) {
      const byCategory =
        orgActiveAttractionIdsByCategory.get(row.organization_id) ?? new Map<string, Set<string>>();
      const set = byCategory.get(row.category) ?? new Set<string>();
      set.add(row.id);
      byCategory.set(row.category, set);
      orgActiveAttractionIdsByCategory.set(row.organization_id, byCategory);
    }
  }

  const distinctAttractionIds = new Set(visitsResult.rows.map((r) => r.attraction_id));
  const distinctCategoriesVisited = new Set<string>();
  const distinctOrganizationsVisited = new Set<string>();

  for (const attractionId of distinctAttractionIds) {
    const meta = attractionMeta.get(attractionId);
    if (!meta) continue;
    if (meta.category) distinctCategoriesVisited.add(meta.category);
    distinctOrganizationsVisited.add(meta.organizationId);
  }

  return {
    distinctAttractionIds,
    distinctCategoriesVisited,
    distinctOrganizationsVisited,
    currentPoints: userResult.rows[0]?.points ?? 0,
    totalActiveAttractions: attractionsResult.rowCount ?? 0,
    activeAttractionIdsByCategory,
    orgActiveAttractionIds,
    orgActiveAttractionIdsByCategory,
  };
}

/**
 * Padrao Observer (GAMMA et al., 1994): disparada apos o evento de registro
 * de uma visita, avaliando todas as conquistas ainda nao desbloqueadas pelo
 * usuario (fixas da plataforma + das organizacoes) e liberando as que
 * atendem aos criterios.
 */
export async function evaluateAchievementsForUser(
  userId: string
): Promise<AchievementRecord[]> {
  const lockedAchievements = await query<AchievementRecord>(
    `SELECT a.* FROM achievements a
     WHERE NOT EXISTS (
       SELECT 1 FROM user_achievements ua
       WHERE ua.achievement_id = a.id AND ua.user_id = $1
     )`,
    [userId]
  );

  if (lockedAchievements.rowCount === 0) {
    return [];
  }

  const ctx = await buildEvaluationContext(userId);
  const unlocked: AchievementRecord[] = [];

  for (const achievement of lockedAchievements.rows) {
    const evaluator = evaluators[achievement.criteria_type];
    const satisfied = evaluator(achievement.criteria_value, ctx, achievement);
    if (!satisfied) continue;

    await query(
      "INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, achievement.id]
    );
    await query("UPDATE users SET points = points + $1, updated_at = now() WHERE id = $2", [
      achievement.points,
      userId,
    ]);
    unlocked.push(achievement);
  }

  return unlocked;
}
