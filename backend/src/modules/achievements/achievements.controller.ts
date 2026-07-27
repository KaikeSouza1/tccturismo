import type { Request, Response } from "express";
import {
  createAchievementSchema,
  updateAchievementSchema,
} from "./achievements.validation";
import {
  createOrganizationAchievement,
  deleteOrganizationAchievement,
  getLeaderboard,
  listAchievementsForAdmin,
  listAchievementsForUser,
  listFixedAchievements,
  updateOrganizationAchievement,
} from "./achievements.service";
import { ACHIEVEMENT_ICONS } from "./achievement-icons";
import { ApiError } from "../../utils/ApiError";

export async function listMine(req: Request, res: Response) {
  if (!req.auth) throw ApiError.unauthorized();
  const achievements = await listAchievementsForUser(req.auth.sub);
  res.json(achievements);
}

export async function leaderboard(req: Request, res: Response) {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const ranking = await getLeaderboard(limit);
  res.json(ranking);
}

export async function icons(_req: Request, res: Response) {
  res.json(ACHIEVEMENT_ICONS);
}

export async function listForOrganization(req: Request, res: Response) {
  if (!req.auth) throw ApiError.unauthorized();
  if (req.auth.role === "platform_admin") {
    res.json(await listFixedAchievements());
    return;
  }
  if (!req.auth.organizationId) throw ApiError.forbidden();
  const achievements = await listAchievementsForAdmin(req.auth.organizationId);
  res.json(achievements);
}

export async function create(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  const input = createAchievementSchema.parse(req.body);
  const achievement = await createOrganizationAchievement(req.auth.organizationId, input);
  res.status(201).json(achievement);
}

export async function update(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  const input = updateAchievementSchema.parse(req.body);
  const achievement = await updateOrganizationAchievement(
    req.auth.organizationId,
    req.params.id,
    input
  );
  res.json(achievement);
}

export async function remove(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  await deleteOrganizationAchievement(req.auth.organizationId, req.params.id);
  res.status(204).send();
}
