import { Router } from "express";
import { create, listAll, listMine } from "./visits.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

export const visitsRouter = Router();

visitsRouter.post("/", requireAuth, asyncHandler(create));
visitsRouter.get("/me", requireAuth, asyncHandler(listMine));
visitsRouter.get("/", requireAuth, requireRole("admin"), asyncHandler(listAll));
