import type { Achievement } from "../types";

export type Rarity = "bronze" | "silver" | "gold" | "legendary";

/**
 * Deriva a raridade de uma conquista a partir do seu criterio de
 * desbloqueio, sem exigir nenhum campo novo no backend alem do que a engine
 * de gamificacao ja usa para avaliar a conquista.
 */
export function getRarity(achievement: Pick<Achievement, "criteriaType" | "criteriaValue">): Rarity {
  switch (achievement.criteriaType) {
    case "all_attractions":
      return "legendary";
    case "category_complete":
    case "specific_attractions":
      return "gold";
    case "attractions_visited_count": {
      const count = Number(achievement.criteriaValue?.count ?? 0);
      if (count >= 20) return "legendary";
      if (count >= 10) return "gold";
      if (count >= 3) return "silver";
      return "bronze";
    }
    case "distinct_organizations_count": {
      const count = Number(achievement.criteriaValue?.count ?? 0);
      if (count >= 3) return "gold";
      if (count >= 2) return "silver";
      return "bronze";
    }
    case "distinct_categories_count": {
      const count = Number(achievement.criteriaValue?.count ?? 0);
      if (count >= 4) return "gold";
      if (count >= 2) return "silver";
      return "bronze";
    }
    case "points_total": {
      const points = Number(achievement.criteriaValue?.points ?? 0);
      if (points >= 300) return "gold";
      if (points >= 100) return "silver";
      return "bronze";
    }
    default:
      return "bronze";
  }
}

export const RARITY_LABEL: Record<Rarity, string> = {
  bronze: "bronze",
  silver: "prata",
  gold: "ouro",
  legendary: "lendaria",
};
