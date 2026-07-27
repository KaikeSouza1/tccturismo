import type { Request, Response } from "express";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { createAttractionSchema, updateAttractionSchema } from "./attractions.validation";
import {
  createAttraction,
  deactivateAttraction,
  getAttractionById,
  getAttractionQrPayload,
  listOrganizationAttractions,
  listPublicAttractions,
  setAttractionImageKey,
  updateAttraction,
} from "./attractions.service";
import { deleteObject, getObjectStream, uploadObject } from "../../config/r2";
import { ApiError } from "../../utils/ApiError";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function list(req: Request, res: Response) {
  if (req.auth?.role === "admin" && req.query.includeInactive === "true") {
    if (!req.auth.organizationId) throw ApiError.forbidden();
    const attractions = await listOrganizationAttractions(req.auth.organizationId);
    res.json(attractions);
    return;
  }
  res.json(await listPublicAttractions());
}

export async function getOne(req: Request, res: Response) {
  const attraction = await getAttractionById(req.params.id);
  res.json({
    id: attraction.id,
    organizationId: attraction.organization_id,
    organizationName: attraction.organization_name,
    name: attraction.name,
    description: attraction.description,
    category: attraction.category,
    latitude: attraction.latitude,
    longitude: attraction.longitude,
    radiusMeters: attraction.radius_meters,
    hasImage: attraction.image_key !== null,
    active: attraction.active,
  });
}

export async function create(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  const input = createAttractionSchema.parse(req.body);
  const attraction = await createAttraction(req.auth.organizationId, input);
  res.status(201).json(attraction);
}

export async function update(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  const input = updateAttractionSchema.parse(req.body);
  const attraction = await updateAttraction(req.auth.organizationId, req.params.id, input);
  res.json(attraction);
}

export async function remove(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  await deactivateAttraction(req.auth.organizationId, req.params.id);
  res.status(204).send();
}

export async function qrCodeImage(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  const { id, token } = await getAttractionQrPayload(req.auth.organizationId, req.params.id);
  const png = await QRCode.toBuffer(`${id}.${token}`, {
    type: "png",
    width: 480,
    margin: 2,
    color: { dark: "#0B4F8A", light: "#FFFFFF" },
  });
  res.setHeader("Content-Type", "image/png");
  res.send(png);
}

export async function uploadImage(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  const file = req.file;
  if (!file) throw ApiError.badRequest("Nenhuma imagem enviada");

  const extension = ALLOWED_IMAGE_TYPES[file.mimetype];
  if (!extension) {
    throw ApiError.badRequest("Formato de imagem invalido. Use JPEG, PNG ou WebP");
  }

  const key = `attractions/${req.params.id}/${crypto.randomUUID()}.${extension}`;
  await uploadObject(key, file.buffer, file.mimetype);
  await setAttractionImageKey(req.auth.organizationId, req.params.id, key);

  res.status(201).json({ hasImage: true });
}

export async function removeImage(req: Request, res: Response) {
  if (!req.auth?.organizationId) throw ApiError.forbidden();
  const attraction = await getAttractionById(req.params.id);
  if (attraction.organization_id !== req.auth.organizationId) {
    throw ApiError.notFound("Atrativo nao encontrado na sua organizacao");
  }
  if (attraction.image_key) {
    await deleteObject(attraction.image_key).catch(() => {});
  }
  await setAttractionImageKey(req.auth.organizationId, req.params.id, null);
  res.status(204).send();
}

export async function serveImage(req: Request, res: Response) {
  const attraction = await getAttractionById(req.params.id);
  if (!attraction.image_key) {
    throw ApiError.notFound("Este atrativo nao possui imagem");
  }
  const { body, contentType } = await getObjectStream(attraction.image_key);
  res.setHeader("Content-Type", contentType ?? "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  body.pipe(res);
}
