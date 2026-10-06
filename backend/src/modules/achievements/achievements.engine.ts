import { query } from "../../config/db";
import type { AchievementCriteriaType, AchievementRecord } from "../../types";

export interface EvaluationContext {
  distinctAttractionIds: Set<string>;
  distinctCategoriesVisited: Set<string>;
  distinctOrganizationsVisited: Set<string>;
  currentPoints: number;
  totalActiveAttractions: number;
  activeAttractionIdsByCategory: Map<string, Set<string>>;
  orgActiveAttractionIds: Map<string, Set<string>>;
  orgActiveAttractionIdsByCategory: Map<string, Map<string, Set<string>>>;
}

export interface AchievementProgress {
  current: number;
  target: number;
}

/**
 * Padrao Strategy (GAMMA et al., 1994): cada tipo de criterio de conquista
 * tem sua propria forma de calcular "quanto falta" a partir do mesmo
 * contexto de avaliacao, permitindo adicionar novas regras de gamificacao
 * sem alterar a engine em si. Conquistas fixas da plataforma
 * (organization_id nulo) sao avaliadas com base em estatisticas globais;
 * conquistas criadas por uma organizacao sao restritas ao universo de
 * atrativos dessa organizacao.
 *
 * O desbloqueio (evaluateAchievementsForUser) e o progresso parcial exibido
 * na tela de conquistas (listAchievementsForUser, em achievements.service.ts)
 * usam exatamente esta mesma funcao como unica fonte de verdade — current
 * >= target e a unica definicao de "satisfeito" em todo o sistema.
 */
type ProgressCalculator = (
  criteriaValue: Record<string, unknown>,
  ctx: EvaluationContext,
  achievement: AchievementRecord
) => AchievementProgress;

export const progressCalculators: Record<AchievementCriteriaType, ProgressCalculator> = {
  attractions_visited_count: (criteria, ctx, achievement) => {
    const target = Number(criteria.count ?? 0);
    if (achievement.organization_id) {
      const orgIds = ctx.orgActiveAttractionIds.get(achievement.organization_id) ?? new Set();
      const current = [...ctx.distinctAttractionIds].filter((id) => orgIds.has(id)).length;
      return { current, target };
    }
    return { current: ctx.distinctAttractionIds.size, target };
  },
  specific_attractions: (criteria, ctx) => {
    const required = (criteria.attractionIds as string[] | undefined) ?? [];
    const current = required.filter((id) => ctx.distinctAttractionIds.has(id)).length;
    return { current, target: required.length };
  },
  all_attractions: (_criteria, ctx, achievement) => {
    if (achievement.organization_id) {
      const orgIds = ctx.orgActiveAttractionIds.get(achievement.organization_id) ?? new Set();
      const current = [...orgIds].filter((id) => ctx.distinctAttractionIds.has(id)).length;
      return { current, target: orgIds.size };
    }
    return { current: ctx.distinctAttractionIds.size, target: ctx.totalActiveAttractions };
  },
  category_complete: (criteria, ctx, achievement) => {
    const category = criteria.category as string | undefined;
    const idsInCategory = category
      ? (achievement.organization_id
          ? ctx.orgActiveAttractionIdsByCategory.get(achievement.organization_id)?.get(category)
          : ctx.activeAttractionIdsByCategory.get(category)) ?? new Set<string>()
      : new Set<string>();
    const current = [...idsInCategory].filter((id) => ctx.distinctAttractionIds.has(id)).length;
    return { current, target: idsInCategory.size };
  },
  points_total: (criteria, ctx) => {
    return { current: ctx.currentPoints, target: Number(criteria.points ?? 0) };
  },
  distinct_categories_count: (criteria, ctx) => {
    return { current: ctx.distinctCategoriesVisited.size, target: Number(criteria.count ?? 0) };
  },
  distinct_organizations_count: (criteria, ctx) => {
    return { current: ctx.distinctOrganizationsVisited.size, target: Number(criteria.count ?? 0) };
  },
};

export function computeProgress(
  achievement: AchievementRecord,
  ctx: EvaluationContext
): AchievementProgress {
  const calculator = progressCalculators[achievement.criteria_type];
  return calculator(achievement.criteria_value, ctx, achievement);
}

/**
 * target 0 (ex: achievement mal configurada com lista/categoria vazia) nunca
 * conta como satisfeita, mesmo que current tambem seja 0 — evita desbloqueio
 * acidental de uma conquista sem criterio real.
 */
export function isProgressSatisfied(progress: AchievementProgress): boolean {
  return progress.target > 0 && progress.current >= progress.target;
}

export async function buildEvaluationContext(userId: string): Promise<EvaluationContext> {
  const [visitsResult, attractionsResult, userResult] = await Promise.all([
    query<{ attraction_id: string }>(
      "SELECT DISTINCT atrativo_id AS attraction_id FROM visitas WHERE usuario_id = $1",
      [userId]
    ),
    query<{ id: string; category: string | null; organization_id: string }>(
      "SELECT id, categoria AS category, organizacao_id AS organization_id FROM atrativos WHERE ativo = true"
    ),
    query<{ points: number }>("SELECT pontos AS points FROM usuarios WHERE id = $1", [userId]),
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
    `SELECT a.id, a.codigo AS code, a.nome AS name, a.descricao AS description, a.icone AS icon,
       a.tipo_criterio AS criteria_type, a.valor_criterio AS criteria_value, a.pontos AS points,
       a.criado_em AS created_at, a.organizacao_id AS organization_id
     FROM conquistas a
     WHERE NOT EXISTS (
       SELECT 1 FROM usuario_conquistas ua
       WHERE ua.conquista_id = a.id AND ua.usuario_id = $1
     )`,
    [userId]
  );

  if (lockedAchievements.rowCount === 0) {
    return [];
  }

  const ctx = await buildEvaluationContext(userId);
  const unlocked: AchievementRecord[] = [];

  for (const achievement of lockedAchievements.rows) {
    const progress = computeProgress(achievement, ctx);
    if (!isProgressSatisfied(progress)) continue;

    await query(
      "INSERT INTO usuario_conquistas (usuario_id, conquista_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, achievement.id]
    );
    await query("UPDATE usuarios SET pontos = pontos + $1, atualizado_em = now() WHERE id = $2", [
      achievement.points,
      userId,
    ]);
    unlocked.push(achievement);
  }

  return unlocked;
}
