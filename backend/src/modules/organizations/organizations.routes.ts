import { Router } from "express";
import { create, list } from "./organizations.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

export const organizationsRouter = Router();

organizationsRouter.use(requireAuth, requireRole("platform_admin"));
organizationsRouter.get("/", asyncHandler(list));
organizationsRouter.post("/", asyncHandler(create));
