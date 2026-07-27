import type { Request, Response } from "express";
import {
  getHeatmapPoints,
  getSummary,
  getVisitsByAttraction,
  getVisitsOverTime,
} from "./dashboard.service";
import { ApiError } from "../../utils/ApiError";

function requireOrganizationId(req: Request): string {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  return req.auth.organizationId;
}

export async function summary(req: Request, res: Response) {
  res.json(await getSummary(requireOrganizationId(req)));
}

export async function visitsByAttraction(req: Request, res: Response) {
  res.json(await getVisitsByAttraction(requireOrganizationId(req)));
}

export async function visitsOverTime(req: Request, res: Response) {
  const granularity = (req.query.granularity as "day" | "week" | "month") ?? "day";
  const days = req.query.days ? Number(req.query.days) : 30;
  res.json(await getVisitsOverTime(requireOrganizationId(req), granularity, days));
}

export async function heatmap(req: Request, res: Response) {
  res.json(await getHeatmapPoints(requireOrganizationId(req)));
}
