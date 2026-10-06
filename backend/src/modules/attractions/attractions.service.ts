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

const ATTRACTION_COLUMNS = `
  a.id, a.nome AS name, a.descricao AS description, a.categoria AS category,
  a.latitude, a.longitude, a.raio_metros AS radius_meters, a.token_qr_code AS qr_code_token,
  a.ativo AS active, a.criado_em AS created_at, a.atualizado_em AS updated_at,
  a.organizacao_id AS organization_id
`;

const ATTRACTION_RETURNING = `
  id, nome AS name, descricao AS description, categoria AS category,
  latitude, longitude, raio_metros AS radius_meters, token_qr_code AS qr_code_token,
  ativo AS active, criado_em AS created_at, atualizado_em AS updated_at,
  organizacao_id AS organization_id
`;

const HAS_IMAGE_SUBQUERY =
  "EXISTS (SELECT 1 FROM atrativo_imagens ai WHERE ai.atrativo_id = a.id) AS has_image";

const IMAGE_COLUMNS =
  "id, atrativo_id AS attraction_id, chave_imagem AS image_key, posicao AS position";

export async function listPublicAttractions() {
  const result = await query<AttractionRecord & { organization_name: string; has_image: boolean }>(
    `SELECT ${ATTRACTION_COLUMNS}, o.nome AS organization_name, ${HAS_IMAGE_SUBQUERY}
     FROM atrativos a
     JOIN organizacoes o ON o.id = a.organizacao_id
     WHERE a.ativo = true
     ORDER BY a.nome`
  );
  return result.rows.map(toPublicAttraction);
}

export async function listOrganizationAttractions(organizationId: string) {
  const result = await query<AttractionRecord & { organization_name: string; has_image: boolean }>(
    `SELECT ${ATTRACTION_COLUMNS}, o.nome AS organization_name, ${HAS_IMAGE_SUBQUERY}
     FROM atrativos a
     JOIN organizacoes o ON o.id = a.organizacao_id
     WHERE a.organizacao_id = $1
     ORDER BY a.nome`,
    [organizationId]
  );
  return result.rows.map(toPublicAttraction);
}

export async function getAttractionById(id: string) {
  const result = await query<AttractionRecord & { organization_name: string; has_image: boolean }>(
    `SELECT ${ATTRACTION_COLUMNS}, o.nome AS organization_name, ${HAS_IMAGE_SUBQUERY}
     FROM atrativos a
     JOIN organizacoes o ON o.id = a.organizacao_id
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
    `INSERT INTO atrativos (organizacao_id, nome, descricao, categoria, latitude, longitude, raio_metros, token_qr_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${ATTRACTION_RETURNING}`,
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
    `UPDATE atrativos SET
       nome = $1,
       descricao = $2,
       categoria = $3,
       latitude = $4,
       longitude = $5,
       raio_metros = $6,
       ativo = $7,
       atualizado_em = now()
     WHERE id = $8
     RETURNING ${ATTRACTION_RETURNING}`,
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
  await query("UPDATE atrativos SET ativo = false, atualizado_em = now() WHERE id = $1", [id]);
}

export async function getAttractionQrPayload(organizationId: string, id: string) {
  const attraction = await getOwnedAttraction(organizationId, id);
  return { id: attraction.id, token: attraction.qr_code_token, name: attraction.name };
}

export async function regenerateAttractionQrToken(organizationId: string, id: string) {
  await getOwnedAttraction(organizationId, id);
  const qrToken = generateQrToken();
  await query("UPDATE atrativos SET token_qr_code = $1, atualizado_em = now() WHERE id = $2", [
    qrToken,
    id,
  ]);
  return { id, token: qrToken };
}

export async function listAttractionImages(attractionId: string) {
  const result = await query<AttractionImageRecord>(
    `SELECT ${IMAGE_COLUMNS} FROM atrativo_imagens WHERE atrativo_id = $1 ORDER BY posicao ASC, criado_em ASC`,
    [attractionId]
  );
  return result.rows;
}

export async function getCoverImage(attractionId: string) {
  const result = await query<AttractionImageRecord>(
    `SELECT ${IMAGE_COLUMNS} FROM atrativo_imagens WHERE atrativo_id = $1 ORDER BY posicao ASC, criado_em ASC LIMIT 1`,
    [attractionId]
  );
  return result.rows[0] ?? null;
}

export async function getAttractionImageById(attractionId: string, imageId: string) {
  const result = await query<AttractionImageRecord>(
    `SELECT ${IMAGE_COLUMNS} FROM atrativo_imagens WHERE id = $1 AND atrativo_id = $2`,
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
    `INSERT INTO atrativo_imagens (atrativo_id, chave_imagem, posicao) VALUES ($1, $2, $3) RETURNING ${IMAGE_COLUMNS}`,
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
  await query("DELETE FROM atrativo_imagens WHERE id = $1", [imageId]);
  return image;
}

export async function setCoverImage(organizationId: string, attractionId: string, imageId: string) {
  await getOwnedAttraction(organizationId, attractionId);
  const images = await listAttractionImages(attractionId);
  const target = images.find((i) => i.id === imageId);
  if (!target) throw ApiError.notFound("Imagem nao encontrada");
  const current = images[0];
  if (!current || current.id === target.id) return;

  await query("UPDATE atrativo_imagens SET posicao = $1 WHERE id = $2", [
    current.position,
    target.id,
  ]);
  await query("UPDATE atrativo_imagens SET posicao = $1 WHERE id = $2", [
    target.position,
    current.id,
  ]);
}
