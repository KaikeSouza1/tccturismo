import { query } from "../../config/db";

export async function getSummary(organizationId: string) {
  const result = await query<{
    total_visits: string;
    total_tourists: string;
    total_attractions: string;
    visits_today: string;
  }>(
    `
    SELECT
      (SELECT COUNT(*) FROM visits v JOIN attractions a ON a.id = v.attraction_id WHERE a.organization_id = $1)::text AS total_visits,
      (SELECT COUNT(DISTINCT v.user_id) FROM visits v JOIN attractions a ON a.id = v.attraction_id WHERE a.organization_id = $1)::text AS total_tourists,
      (SELECT COUNT(*) FROM attractions WHERE organization_id = $1 AND active = true)::text AS total_attractions,
      (SELECT COUNT(*) FROM visits v JOIN attractions a ON a.id = v.attraction_id WHERE a.organization_id = $1 AND v.created_at >= date_trunc('day', now()))::text AS visits_today
  `,
    [organizationId]
  );

  const row = result.rows[0];
  return {
    totalVisits: Number(row.total_visits),
    totalTourists: Number(row.total_tourists),
    totalAttractions: Number(row.total_attractions),
    visitsToday: Number(row.visits_today),
  };
}

export async function getVisitsByAttraction(organizationId: string) {
  const result = await query<{
    attraction_id: string;
    attraction_name: string;
    visit_count: string;
  }>(
    `
    SELECT a.id AS attraction_id, a.name AS attraction_name, COUNT(v.id)::text AS visit_count
    FROM attractions a
    LEFT JOIN visits v ON v.attraction_id = a.id
    WHERE a.active = true AND a.organization_id = $1
    GROUP BY a.id, a.name
    ORDER BY COUNT(v.id) DESC
  `,
    [organizationId]
  );

  return result.rows.map((row) => ({
    attractionId: row.attraction_id,
    attractionName: row.attraction_name,
    visitCount: Number(row.visit_count),
  }));
}

type Granularity = "day" | "week" | "month";

export async function getVisitsOverTime(
  organizationId: string,
  granularity: Granularity = "day",
  days = 30
) {
  const result = await query<{ bucket: Date; visit_count: string }>(
    `
    SELECT date_trunc($1, v.created_at) AS bucket, COUNT(*)::text AS visit_count
    FROM visits v
    JOIN attractions a ON a.id = v.attraction_id
    WHERE a.organization_id = $2 AND v.created_at >= now() - ($3 || ' days')::interval
    GROUP BY bucket
    ORDER BY bucket ASC
    `,
    [granularity, organizationId, days]
  );

  return result.rows.map((row) => ({
    date: row.bucket,
    visitCount: Number(row.visit_count),
  }));
}

export async function getHeatmapPoints(organizationId: string) {
  const result = await query<{
    latitude: number;
    longitude: number;
    attraction_name: string;
    visit_count: string;
  }>(
    `
    SELECT a.latitude, a.longitude, a.name AS attraction_name, COUNT(v.id)::text AS visit_count
    FROM attractions a
    LEFT JOIN visits v ON v.attraction_id = a.id
    WHERE a.active = true AND a.organization_id = $1
    GROUP BY a.id, a.latitude, a.longitude, a.name
  `,
    [organizationId]
  );

  return result.rows.map((row) => ({
    latitude: row.latitude,
    longitude: row.longitude,
    attractionName: row.attraction_name,
    weight: Number(row.visit_count),
  }));
}
