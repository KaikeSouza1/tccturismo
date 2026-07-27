import crypto from "node:crypto";
import { query } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type { AttractionRecord } from "../../types";

export const MAX_ATTRACTION_IMAGES = 6;

interface CreateAttractionInput {
  name: string;
  description?: string;
  category?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

type UpdateAttractionInput = Partial<CreateAttractionInput> & { active?: boolean };

export interface AttractionImageRecord {
  id: string;
  attraction_id: string;
  image_key: string;
  position: number;
}

function generateQrToken(): string {
  return `TCC-${crypto.randomBytes(12).toString("hex")}`;
}

function toPublicAttraction(
  attraction: AttractionRecord & { organization_name?: string; has_image: boolean }
) {
  return {
    id: attraction.id,
    organizationId: attraction.organization_id,
    organizationName: attraction.organization_name ?? null,
    name: attraction.name,
    description: attraction.description,
    category: attraction.category,
    latitude: attraction.latitude,
    longitude: attraction.longitude,
    radiusMeters: attraction.radius_meters,
    hasImage: attraction.has_image,
    active: attraction.active,
  };
}

const HAS_IMAGE_SUBQUERY =
  "EXISTS (SELECT 1 FROM attraction_images ai WHERE ai.attraction_id = a.id) AS has_image";

export async function listPublicAttractions() {
  const result = await query<AttractionRecord & { organization_name: string; has_image: boolean }>(
    `SELECT a.*, o.name AS organization_name, ${HAS_IMAGE_SUBQUERY}
     FROM attractions a
     JOIN organizations o ON o.id = a.organization_id
     WHERE a.active = true
     ORDER BY a.name`
  );
  return result.rows.map(toPublicAttraction);
}

export async function listOrganizationAttractions(organizationId: string) {
  const result = await query<AttractionRecord & { organization_name: string; has_image: boolean }>(
    `SELECT a.*, o.name AS organization_name, ${HAS_IMAGE_SUBQUERY}
     FROM attractions a
     JOIN organizations o ON o.id = a.organization_id
     WHERE a.organization_id = $1
     ORDER BY a.name`,
    [organizationId]
  );
  return result.rows.map(toPublicAttraction);
}

export async function getAttractionById(id: string) {
  const result = await query<AttractionRecord & { organization_name: string; has_image: boolean }>(
    `SELECT a.*, o.name AS organization_name, ${HAS_IMAGE_SUBQUERY}
     FROM attractions a
     JOIN organizations o ON o.id = a.organization_id
     WHERE a.id = $1`,
    [id]
  );
  const attraction = result.rows[0];
  if (!attraction) {
    throw ApiError.notFound("Atrativo nao encontrado");
  }
  return attraction;
}

async function getOwnedAttraction(organizationId: string, id: string) {
  const attraction = await getAttractionById(id);
  if (attraction.organization_id !== organizationId) {
    throw ApiError.notFound("Atrativo nao encontrado na sua organizacao");
  }
  return attraction;
}

export async function createAttraction(organizationId: string, input: CreateAttractionInput) {
  const qrToken = generateQrToken();
  const result = await query<AttractionRecord>(
    `INSERT INTO attractions (organization_id, name, description, category, latitude, longitude, radius_meters, qr_code_token)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      organizationId,
      input.name,
      input.description ?? null,
      input.category ?? null,
      input.latitude,
      input.longitude,
      input.radiusMeters ?? 60,
      qrToken,
    ]
  );
  return toPublicAttraction({ ...result.rows[0], has_image: false });
}

export async function updateAttraction(
  organizationId: string,
  id: string,
  input: UpdateAttractionInput
) {
  const current = await getOwnedAttraction(organizationId, id);

  const result = await query<AttractionRecord>(
    `UPDATE attractions SET
       name = $1,
       description = $2,
       category = $3,
       latitude = $4,
       longitude = $5,
       radius_meters = $6,
       active = $7,
       updated_at = now()
     WHERE id = $8
     RETURNING *`,
    [
      input.name ?? current.name,
      input.description ?? current.description,
      input.category ?? current.category,
      input.latitude ?? current.latitude,
      input.longitude ?? current.longitude,
      input.radiusMeters ?? current.radius_meters,
      input.active ?? current.active,
      id,
    ]
  );
  return toPublicAttraction({ ...result.rows[0], has_image: current.has_image });
}

export async function deactivateAttraction(organizationId: string, id: string) {
  await getOwnedAttraction(organizationId, id);
  await query("UPDATE attractions SET active = false, updated_at = now() WHERE id = $1", [id]);
}

export async function getAttractionQrPayload(organizationId: string, id: string) {
  const attraction = await getOwnedAttraction(organizationId, id);
  return { id: attraction.id, token: attraction.qr_code_token, name: attraction.name };
}

export async function regenerateAttractionQrToken(organizationId: string, id: string) {
  await getOwnedAttraction(organizationId, id);
  const qrToken = generateQrToken();
  await query("UPDATE attractions SET qr_code_token = $1, updated_at = now() WHERE id = $2", [
    qrToken,
    id,
  ]);
  return { id, token: qrToken };
}

export async function listAttractionImages(attractionId: string) {
  const result = await query<AttractionImageRecord>(
    "SELECT * FROM attraction_images WHERE attraction_id = $1 ORDER BY position ASC, created_at ASC",
    [attractionId]
  );
  return result.rows;
}

export async function getCoverImage(attractionId: string) {
  const result = await query<AttractionImageRecord>(
    "SELECT * FROM attraction_images WHERE attraction_id = $1 ORDER BY position ASC, created_at ASC LIMIT 1",
    [attractionId]
  );
  return result.rows[0] ?? null;
}

export async function getAttractionImageById(attractionId: string, imageId: string) {
  const result = await query<AttractionImageRecord>(
    "SELECT * FROM attraction_images WHERE id = $1 AND attraction_id = $2",
    [imageId, attractionId]
  );
  const image = result.rows[0];
  if (!image) throw ApiError.notFound("Imagem nao encontrada");
  return image;
}

export async function addAttractionImage(
  organizationId: string,
  attractionId: string,
  imageKey: string
) {
  await getOwnedAttraction(organizationId, attractionId);
  const existing = await listAttractionImages(attractionId);
  if (existing.length >= MAX_ATTRACTION_IMAGES) {
    throw ApiError.badRequest(`Limite de ${MAX_ATTRACTION_IMAGES} fotos por atrativo`);
  }
  const nextPosition = existing.length > 0 ? Math.max(...existing.map((i) => i.position)) + 1 : 0;
  const result = await query<AttractionImageRecord>(
    "INSERT INTO attraction_images (attraction_id, image_key, position) VALUES ($1, $2, $3) RETURNING *",
    [attractionId, imageKey, nextPosition]
  );
  return result.rows[0];
}

export async function removeAttractionImage(
  organizationId: string,
  attractionId: string,
  imageId: string
) {
  await getOwnedAttraction(organizationId, attractionId);
  const image = await getAttractionImageById(attractionId, imageId);
  await query("DELETE FROM attraction_images WHERE id = $1", [imageId]);
  return image;
}

export async function setCoverImage(organizationId: string, attractionId: string, imageId: string) {
  await getOwnedAttraction(organizationId, attractionId);
  const images = await listAttractionImages(attractionId);
  const target = images.find((i) => i.id === imageId);
  if (!target) throw ApiError.notFound("Imagem nao encontrada");
  const current = images[0];
  if (!current || current.id === target.id) return;

  await query("UPDATE attraction_images SET position = $1 WHERE id = $2", [
    current.position,
    target.id,
  ]);
  await query("UPDATE attraction_images SET position = $1 WHERE id = $2", [
    target.position,
    current.id,
  ]);
}
