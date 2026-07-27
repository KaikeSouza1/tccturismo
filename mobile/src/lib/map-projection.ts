export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Projection {
  (point: GeoPoint): { x: number; y: number };
}

/**
 * Projecao linear simples (min/max scaling) de coordenadas geograficas para
 * um viewBox de SVG fixo. Nao depende de nenhum servico de mapas externo -
 * funciona 100% offline, calibrada apenas pelos proprios pontos fornecidos.
 */
export function createProjection(points: GeoPoint[], width: number, height: number, padding = 28): Projection {
  if (points.length === 0) {
    return () => ({ x: width / 2, y: height / 2 });
  }

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.002;
  const lngRange = maxLng - minLng || 0.002;

  return (point: GeoPoint) => {
    const x = padding + ((point.longitude - minLng) / lngRange) * (width - padding * 2);
    const y = padding + (1 - (point.latitude - minLat) / latRange) * (height - padding * 2);
    return { x, y };
  };
}

/** Ruido determinístico (0 a 1) para simular um leve "tremor de mao" no traco do trajeto. */
export function seededJitter(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/** Distancia total percorrida (em metros) ao longo de uma sequencia ordenada de pontos. */
export function totalTrailDistance(points: GeoPoint[], distanceFn: (a: GeoPoint, b: GeoPoint) => number): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanceFn(points[i - 1], points[i]);
  }
  return total;
}
