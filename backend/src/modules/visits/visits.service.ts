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
    "SELECT * FROM attractions WHERE qr_code_token = $1 AND active = true",
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
    `INSERT INTO visits (user_id, attraction_id, latitude, longitude, distance_meters, client_recorded_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
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
  const unlockedAchievements = await evaluateAchievementsForUser(userId);

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
    `SELECT v.*, a.name AS attraction_name
     FROM visits v
     JOIN attractions a ON a.id = v.attraction_id
     WHERE v.user_id = $1
     ORDER BY v.created_at DESC`,
    [userId]
  );
  return result.rows.map(toPublicVisit);
}

export async function getOwnedVisit(userId: string, visitId: string) {
  const result = await query<VisitRecord>("SELECT * FROM visits WHERE id = $1", [visitId]);
  const visit = result.rows[0];
  if (!visit || visit.user_id !== userId) {
    throw ApiError.notFound("Visita nao encontrada");
  }
  return visit;
}

export async function setVisitPhotoKey(userId: string, visitId: string, photoKey: string) {
  await getOwnedVisit(userId, visitId);
  await query("UPDATE visits SET photo_key = $1 WHERE id = $2", [photoKey, visitId]);
}

export async function listVisits(filter: ListVisitsFilter) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  params.push(filter.organizationId);
  conditions.push(`a.organization_id = $${params.length}`);

  if (filter.attractionId) {
    params.push(filter.attractionId);
    conditions.push(`v.attraction_id = $${params.length}`);
  }
  if (filter.from) {
    params.push(filter.from);
    conditions.push(`v.created_at >= $${params.length}`);
  }
  if (filter.to) {
    params.push(filter.to);
    conditions.push(`v.created_at <= $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const pageSize = filter.pageSize ?? 50;
  const page = filter.page ?? 1;
  const offset = (page - 1) * pageSize;

  params.push(pageSize, offset);

  const result = await query<
    VisitRecord & { attraction_name: string; tourist_name: string }
  >(
    `SELECT v.*, a.name AS attraction_name, u.name AS tourist_name
     FROM visits v
     JOIN attractions a ON a.id = v.attraction_id
     JOIN users u ON u.id = v.user_id
     ${whereClause}
     ORDER BY v.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return result.rows.map((row) => ({
    ...toPublicVisit(row),
    touristName: row.tourist_name,
  }));
}
