import type { Request, Response } from "express";
import { createOrganizationSchema } from "./organizations.validation";
import { createOrganizationWithAdmin, listOrganizationsWithStats } from "./organizations.service";

export async function list(_req: Request, res: Response) {
  res.json(await listOrganizationsWithStats());
}

export async function create(req: Request, res: Response) {
  const input = createOrganizationSchema.parse(req.body);
  const organization = await createOrganizationWithAdmin(input);
  res.status(201).json(organization);
}
