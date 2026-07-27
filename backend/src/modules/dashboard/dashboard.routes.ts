import { Router } from "express";
import { heatmap, summary, visitsByAttraction, visitsOverTime } from "./dashboard.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth, requireRole("admin"));
dashboardRouter.get("/summary", asyncHandler(summary));
dashboardRouter.get("/visits-by-attraction", asyncHandler(visitsByAttraction));
dashboardRouter.get("/visits-over-time", asyncHandler(visitsOverTime));
dashboardRouter.get("/heatmap", asyncHandler(heatmap));
