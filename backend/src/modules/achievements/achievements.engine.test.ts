import { describe, expect, it } from "vitest";
import {
  computeProgress,
  isProgressSatisfied,
  type EvaluationContext,
} from "./achievements.engine";
import type { AchievementRecord } from "../../types";

function baseAchievement(overrides: Partial<AchievementRecord> = {}): AchievementRecord {
  return {
    id: "ach-1",
    organization_id: null,
    code: "teste",
    name: "Teste",
    description: null,
    icon: "Star",
    criteria_type: "attractions_visited_count",
    criteria_value: {},
    points: 10,
    created_at: new Date(),
    ...overrides,
  };
}

function baseContext(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    distinctAttractionIds: new Set(),
    distinctCategoriesVisited: new Set(),
    distinctOrganizationsVisited: new Set(),
    currentPoints: 0,
    totalActiveAttractions: 0,
    activeAttractionIdsByCategory: new Map(),
    orgActiveAttractionIds: new Map(),
    orgActiveAttractionIdsByCategory: new Map(),
    ...overrides,
  };
}

describe("attractions_visited_count", () => {
  it("global: nao satisfeita abaixo do alvo", () => {
    const achievement = baseAchievement({ criteria_type: "attractions_visited_count", criteria_value: { count: 3 } });
    const ctx = baseContext({ distinctAttractionIds: new Set(["a1", "a2"]) });
    const progress = computeProgress(achievement, ctx);
    expect(progress).toEqual({ current: 2, target: 3 });
    expect(isProgressSatisfied(progress)).toBe(false);
  });

  it("global: satisfeita exatamente no alvo", () => {
    const achievement = baseAchievement({ criteria_type: "attractions_visited_count", criteria_value: { count: 3 } });
    const ctx = baseContext({ distinctAttractionIds: new Set(["a1", "a2", "a3"]) });
    expect(isProgressSatisfied(computeProgress(achievement, ctx))).toBe(true);
  });

  it("restrita a organizacao: so conta atrativos daquela organizacao", () => {
    const achievement = baseAchievement({
      organization_id: "org-1",
      criteria_type: "attractions_visited_count",
      criteria_value: { count: 2 },
    });
    const ctx = baseContext({
      distinctAttractionIds: new Set(["a1", "a2", "a3"]), // a3 e de outra org
      orgActiveAttractionIds: new Map([["org-1", new Set(["a1", "a2"])]]),
    });
    const progress = computeProgress(achievement, ctx);
    expect(progress).toEqual({ current: 2, target: 2 });
    expect(isProgressSatisfied(progress)).toBe(true);
  });
});

describe("specific_attractions", () => {
  it("conta quantos dos exigidos ja foram visitados", () => {
    const achievement = baseAchievement({
      criteria_type: "specific_attractions",
      criteria_value: { attractionIds: ["a1", "a2", "a3"] },
    });
    const ctx = baseContext({ distinctAttractionIds: new Set(["a1", "a3", "a9"]) });
    const progress = computeProgress(achievement, ctx);
    expect(progress).toEqual({ current: 2, target: 3 });
    expect(isProgressSatisfied(progress)).toBe(false);
  });

  it("lista vazia nunca e satisfeita (target 0)", () => {
    const achievement = baseAchievement({
      criteria_type: "specific_attractions",
      criteria_value: { attractionIds: [] },
    });
    const progress = computeProgress(achievement, baseContext());
    expect(progress.target).toBe(0);
    expect(isProgressSatisfied(progress)).toBe(false);
  });
});

describe("all_attractions", () => {
  it("global: precisa visitar todos os atrativos ativos da plataforma", () => {
    const achievement = baseAchievement({ criteria_type: "all_attractions" });
    const ctx = baseContext({
      distinctAttractionIds: new Set(["a1", "a2"]),
      totalActiveAttractions: 3,
    });
    const progress = computeProgress(achievement, ctx);
    expect(progress).toEqual({ current: 2, target: 3 });
    expect(isProgressSatisfied(progress)).toBe(false);
  });

  it("restrita a organizacao: alvo e o total de atrativos daquela organizacao", () => {
    const achievement = baseAchievement({ organization_id: "org-1", criteria_type: "all_attractions" });
    const ctx = baseContext({
      distinctAttractionIds: new Set(["a1", "a2"]),
      orgActiveAttractionIds: new Map([["org-1", new Set(["a1", "a2"])]]),
      totalActiveAttractions: 10, // atrativos de outras orgs tambem contam aqui, mas nao devem influenciar
    });
    const progress = computeProgress(achievement, ctx);
    expect(progress).toEqual({ current: 2, target: 2 });
    expect(isProgressSatisfied(progress)).toBe(true);
  });
});

describe("category_complete", () => {
  it("conta visitados dentro da categoria", () => {
    const achievement = baseAchievement({
      criteria_type: "category_complete",
      criteria_value: { category: "natureza" },
    });
    const ctx = baseContext({
      distinctAttractionIds: new Set(["a1"]),
      activeAttractionIdsByCategory: new Map([["natureza", new Set(["a1", "a2"])]]),
    });
    const progress = computeProgress(achievement, ctx);
    expect(progress).toEqual({ current: 1, target: 2 });
    expect(isProgressSatisfied(progress)).toBe(false);
  });

  it("categoria inexistente no contexto -> target 0, nunca satisfeita", () => {
    const achievement = baseAchievement({
      criteria_type: "category_complete",
      criteria_value: { category: "inexistente" },
    });
    const progress = computeProgress(achievement, baseContext());
    expect(progress.target).toBe(0);
    expect(isProgressSatisfied(progress)).toBe(false);
  });
});

describe("points_total", () => {
  it("compara pontos acumulados com o alvo", () => {
    const achievement = baseAchievement({ criteria_type: "points_total", criteria_value: { points: 300 } });
    expect(isProgressSatisfied(computeProgress(achievement, baseContext({ currentPoints: 299 })))).toBe(false);
    expect(isProgressSatisfied(computeProgress(achievement, baseContext({ currentPoints: 300 })))).toBe(true);
  });
});

describe("distinct_categories_count", () => {
  it("conta categorias distintas visitadas", () => {
    const achievement = baseAchievement({
      criteria_type: "distinct_categories_count",
      criteria_value: { count: 2 },
    });
    const ctx = baseContext({ distinctCategoriesVisited: new Set(["natureza", "cultural"]) });
    expect(isProgressSatisfied(computeProgress(achievement, ctx))).toBe(true);
  });
});

describe("distinct_organizations_count", () => {
  it("conta organizacoes distintas visitadas", () => {
    const achievement = baseAchievement({
      criteria_type: "distinct_organizations_count",
      criteria_value: { count: 2 },
    });
    const ctx = baseContext({ distinctOrganizationsVisited: new Set(["org-1"]) });
    expect(isProgressSatisfied(computeProgress(achievement, ctx))).toBe(false);
  });
});
