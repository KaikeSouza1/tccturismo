import { Router } from "express";
import {
  create,
  icons,
  leaderboard,
  listForOrganization,
  listMine,
  remove,
  update,
} from "./achievements.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

export const achievementsRouter = Router();

achievementsRouter.get("/me", requireAuth, asyncHandler(listMine));
achievementsRouter.get("/leaderboard", requireAuth, asyncHandler(leaderboard));
achievementsRouter.get("/icons", requireAuth, requireRole("admin"), asyncHandler(icons));
achievementsRouter.get(
  "/organization",
  requireAuth,
  requireRole("admin", "platform_admin"),
  asyncHandler(listForOrganization)
);
achievementsRouter.post("/", requireAuth, requireRole("admin"), asyncHandler(create));
achievementsRouter.put("/:id", requireAuth, requireRole("admin"), asyncHandler(update));
achievementsRouter.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(remove));
