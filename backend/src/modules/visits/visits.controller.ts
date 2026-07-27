import type { Request, Response } from "express";
import crypto from "node:crypto";
import { listVisitsQuerySchema, registerVisitSchema } from "./visits.validation";
import { getOwnedVisit, listMyVisits, listVisits, registerVisit, setVisitPhotoKey } from "./visits.service";
import { getObjectStream, uploadObject } from "../../config/r2";
import { ApiError } from "../../utils/ApiError";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

export async function uploadPhoto(req: Request, res: Response) {
  if (!req.auth) throw ApiError.unauthorized();
  const file = req.file;
  if (!file) throw ApiError.badRequest("Nenhuma imagem enviada");

  const extension = ALLOWED_IMAGE_TYPES[file.mimetype];
  if (!extension) {
    throw ApiError.badRequest("Formato de imagem invalido. Use JPEG, PNG ou WebP");
  }

  const key = `visits/${req.params.id}/${crypto.randomUUID()}.${extension}`;
  await uploadObject(key, file.buffer, file.mimetype);
  await setVisitPhotoKey(req.auth.sub, req.params.id, key);

  res.status(201).json({ hasPhoto: true });
}

export async function servePhoto(req: Request, res: Response) {
  if (!req.auth) throw ApiError.unauthorized();
  const visit = await getOwnedVisit(req.auth.sub, req.params.id);
  if (!visit.photo_key) {
    throw ApiError.notFound("Esta visita nao possui foto");
  }
  const { body, contentType } = await getObjectStream(visit.photo_key);
  res.setHeader("Content-Type", contentType ?? "image/jpeg");
  res.setHeader("Cache-Control", "private, max-age=86400");
  body.pipe(res);
}
