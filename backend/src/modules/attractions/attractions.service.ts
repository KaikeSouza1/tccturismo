import crypto from "node:crypto";
import { query } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type { AttractionRecord } from "../../types";

interface CreateAttractionInput {
  name: string;
  description?: string;
  category?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

type UpdateAttractionInput = Partial<CreateAttractionInput> & { active?: boolean };

function generateQrToken(): string {
  return `TCC-${crypto.randomBytes(12).toString("hex")}`;
}

function toPublicAttraction(attraction: AttractionRecord & { organization_name?: string }) {
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
    hasImage: attraction.image_key !== null,
    active: attraction.active,
  };
}

export async function listPublicAttractions() {
  const result = await query<AttractionRecord & { organization_name: string }>(
    `SELECT a.*, o.name AS organization_name
     FROM attractions a
     JOIN organizations o ON o.id = a.organization_id
     WHERE a.active = true
     ORDER BY a.name`
  );
  return result.rows.map(toPublicAttraction);
}

export async function listOrganizationAttractions(organizationId: string) {
  const result = await query<AttractionRecord & { organization_name: string }>(
    `SELECT a.*, o.name AS organization_name
     FROM attractions a
     JOIN organizations o ON o.id = a.organization_id
     WHERE a.organization_id = $1
     ORDER BY a.name`,
    [organizationId]
  );
  return result.rows.map(toPublicAttraction);
}

export async function getAttractionById(id: string) {
  const result = await query<AttractionRecord & { organization_name: string }>(
    `SELECT a.*, o.name AS organization_name
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
  return toPublicAttraction(result.rows[0]);
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
  return toPublicAttraction(result.rows[0]);
}

export async function deactivateAttraction(organizationId: string, id: string) {
  await getOwnedAttraction(organizationId, id);
  await query("UPDATE attractions SET active = false, updated_at = now() WHERE id = $1", [id]);
}

export async function setAttractionImageKey(
  organizationId: string,
  id: string,
  imageKey: string | null
) {
  await getOwnedAttraction(organizationId, id);
  await query("UPDATE attractions SET image_key = $1, updated_at = now() WHERE id = $2", [
    imageKey,
    id,
  ]);
}

export async function getAttractionQrPayload(organizationId: string, id: string) {
  const attraction = await getOwnedAttraction(organizationId, id);
  return { id: attraction.id, token: attraction.qr_code_token, name: attraction.name };
}
