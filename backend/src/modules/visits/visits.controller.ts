import type { Request, Response } from "express";
import { listVisitsQuerySchema, registerVisitSchema } from "./visits.validation";
import { listMyVisits, listVisits, registerVisit } from "./visits.service";
import { ApiError } from "../../utils/ApiError";

export async function create(req: Request, res: Response) {
  if (!req.auth) throw ApiError.unauthorized();
  const input = registerVisitSchema.parse(req.body);
  const result = await registerVisit(req.auth.sub, input);
  res.status(201).json(result);
}

export async function listMine(req: Request, res: Response) {
  if (!req.auth) throw ApiError.unauthorized();
  const visits = await listMyVisits(req.auth.sub);
  res.json(visits);
}

export async function listAll(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  const filter = listVisitsQuerySchema.parse(req.query);
  const visits = await listVisits({ ...filter, organizationId: req.auth.organizationId });
  res.json(visits);
}
