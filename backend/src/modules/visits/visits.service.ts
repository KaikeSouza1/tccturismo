import { query } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { distanceInMeters } from "../../utils/geo";
import { evaluateAchievementsForUser } from "../achievements/achievements.engine";
import type { AttractionRecord, VisitRecord } from "../../types";

interface RegisterVisitInput {
  qrToken: string;
  latitude: number;
  longitude: number;
  clientRecordedAt?: string;
}

interface ListVisitsFilter {
  organizationId: string;
  attractionId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

const ATTRACTION_COLUMNS = `
  id, nome AS name, descricao AS description, categoria AS category,
  latitude, longitude, raio_metros AS radius_meters, token_qr_code AS qr_code_token,
  ativo AS active, criado_em AS created_at, atualizado_em AS updated_at,
  organizacao_id AS organization_id
`;

const VISIT_COLUMNS = `
  v.id, v.usuario_id AS user_id, v.atrativo_id AS attraction_id, v.latitude, v.longitude,
  v.distancia_metros AS distance_meters, v.chave_foto AS photo_key,
  v.registrado_em_cliente AS client_recorded_at, v.sincronizado_em AS synced_at,
  v.criado_em AS created_at
`;

const VISIT_RETURNING = `
  id, usuario_id AS user_id, atrativo_id AS attraction_id, latitude, longitude,
  distancia_metros AS distance_meters, chave_foto AS photo_key,
  registrado_em_cliente AS client_recorded_at, sincronizado_em AS synced_at,
  criado_em AS created_at
`;

function toPublicVisit(visit: VisitRecord & { attraction_name?: string }) {
  return {
    id: visit.id,
    attractionId: visit.attraction_id,
    attractionName: visit.attraction_name,
    latitude: visit.latitude,
    longitude: visit.longitude,
    distanceMeters: Math.round(visit.distance_meters),
    hasPhoto: visit.photo_key !== null,
    clientRecordedAt: visit.client_recorded_at,
    createdAt: visit.created_at,
  };
}

export async function registerVisit(userId: string, input: RegisterVisitInput) {
  const attractionResult = await query<AttractionRecord>(
    `SELECT ${ATTRACTION_COLUMNS} FROM atrativos WHERE token_qr_code = $1 AND ativo = true`,
    [input.qrToken]
  );
  const attraction = attractionResult.rows[0];
  if (!attraction) {
    throw ApiError.notFound("QR Code nao corresponde a nenhum atrativo ativo");
  }

  const distance = distanceInMeters(
    input.latitude,
    input.longitude,
    attraction.latitude,
    attraction.longitude
  );

  if (distance > attraction.radius_meters) {
    throw ApiError.badRequest(
      `Voce esta a ${Math.round(distance)}m do atrativo. Aproxime-se ate ${attraction.radius_meters}m para registrar a visita.`
    );
  }

  const result = await query<VisitRecord>(
    `INSERT INTO visitas (usuario_id, atrativo_id, latitude, longitude, distancia_metros, registrado_em_cliente)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${VISIT_RETURNING}`,
    [
      userId,
      attraction.id,
      input.latitude,
      input.longitude,
      distance,
      input.clientRecordedAt ? new Date(input.clientRecordedAt) : new Date(),
    ]
  );

  const visit = result.rows[0];

  // A visita ja foi persistida com sucesso nesse ponto — uma falha aqui
  // (bug na engine, erro de banco pontual etc) nunca pode fazer o turista
  // ver a visita como rejeitada. Na pior das hipoteses, o desbloqueio de
  // conquistas fica para a proxima visita (a engine reavalia tudo que ainda
  // nao foi desbloqueado a cada chamada).
  let unlockedAchievements: Awaited<ReturnType<typeof evaluateAchievementsForUser>> = [];
  try {
    unlockedAchievements = await evaluateAchievementsForUser(userId);
  } catch (err) {
    console.error(`Falha ao avaliar conquistas para o usuario ${userId} apos a visita ${visit.id}:`, err);
  }

  return {
    visit: { ...toPublicVisit(visit), attractionName: attraction.name },
    unlockedAchievements: unlockedAchievements.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      points: a.points,
      criteriaType: a.criteria_type,
      criteriaValue: a.criteria_value,
      organizationId: a.organization_id,
    })),
  };
}

export async function listMyVisits(userId: string) {
  const result = await query<VisitRecord & { attraction_name: string }>(
    `SELECT ${VISIT_COLUMNS}, a.nome AS attraction_name
     FROM visitas v
     JOIN atrativos a ON a.id = v.atrativo_id
     WHERE v.usuario_id = $1
     ORDER BY v.criado_em DESC`,
    [userId]
  );
  return result.rows.map(toPublicVisit);
}

export async function getOwnedVisit(userId: string, visitId: string) {
  const result = await query<VisitRecord>(
    `SELECT ${VISIT_RETURNING} FROM visitas WHERE id = $1`,
    [visitId]
  );
  const visit = result.rows[0];
  if (!visit || visit.user_id !== userId) {
    throw ApiError.notFound("Visita nao encontrada");
  }
  return visit;
}

export async function setVisitPhotoKey(userId: string, visitId: string, photoKey: string) {
  await getOwnedVisit(userId, visitId);
  await query("UPDATE visitas SET chave_foto = $1 WHERE id = $2", [photoKey, visitId]);
}

export async function listVisits(filter: ListVisitsFilter) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  params.push(filter.organizationId);
  conditions.push(`a.organizacao_id = $${params.length}`);

  if (filter.attractionId) {
    params.push(filter.attractionId);
    conditions.push(`v.atrativo_id = $${params.length}`);
  }
  if (filter.from) {
    params.push(filter.from);
    conditions.push(`v.criado_em >= $${params.length}`);
  }
  if (filter.to) {
    params.push(filter.to);
    conditions.push(`v.criado_em <= $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const pageSize = filter.pageSize ?? 50;
  const page = filter.page ?? 1;
  const offset = (page - 1) * pageSize;

  params.push(pageSize, offset);

  const result = await query<
    VisitRecord & { attraction_name: string; tourist_name: string }
  >(
    `SELECT ${VISIT_COLUMNS}, a.nome AS attraction_name, u.nome AS tourist_name
     FROM visitas v
     JOIN atrativos a ON a.id = v.atrativo_id
     JOIN usuarios u ON u.id = v.usuario_id
     ${whereClause}
     ORDER BY v.criado_em DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return result.rows.map((row) => ({
    ...toPublicVisit(row),
    touristName: row.tourist_name,
  }));
}
