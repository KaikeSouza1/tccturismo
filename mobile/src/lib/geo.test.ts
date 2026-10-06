import { describe, expect, it } from "vitest";
import { distanceInMeters } from "./geo";

const EARTH_RADIUS_METERS = 6371000;

describe("distanceInMeters (mobile)", () => {
  it("retorna 0 para o mesmo ponto", () => {
    expect(distanceInMeters(-26.2288, -51.0895, -26.2288, -51.0895)).toBe(0);
  });

  it("e simetrica (A->B === B->A)", () => {
    const a = { lat: -26.2288, lon: -51.0895 };
    const b = { lat: -26.0557, lon: -51.3882 };
    const ab = distanceInMeters(a.lat, a.lon, b.lat, b.lon);
    const ba = distanceInMeters(b.lat, b.lon, a.lat, a.lon);
    expect(ab).toBeCloseTo(ba, 9);
  });

  it("bate com um par de coordenadas reais de distancia conhecida (tolerancia 0,5%)", () => {
    // Mesmo par de referencia usado no teste do backend (Nashville -> Los
    // Angeles, ~2887.259 km), para garantir que as duas implementacoes
    // duplicadas (backend e mobile) concordam com a mesma referencia externa.
    const nashville = { lat: 36.12, lon: -86.67 };
    const losAngeles = { lat: 33.94, lon: -118.4 };
    const expectedMeters = 2887259;

    const result = distanceInMeters(nashville.lat, nashville.lon, losAngeles.lat, losAngeles.lon);

    const tolerance = expectedMeters * 0.005;
    expect(Math.abs(result - expectedMeters)).toBeLessThanOrEqual(tolerance);
  });

  describe("bordas do raio de geofencing (raio de 60m)", () => {
    const RADIUS = 60;
    const origin = { lat: -26.2288, lon: -51.0895 };

    function pointAtMetersNorth(meters: number) {
      const dLatRad = meters / EARTH_RADIUS_METERS;
      const dLatDeg = (dLatRad * 180) / Math.PI;
      return { lat: origin.lat + dLatDeg, lon: origin.lon };
    }

    it("59m fica dentro do raio", () => {
      const p = pointAtMetersNorth(59);
      const distance = distanceInMeters(origin.lat, origin.lon, p.lat, p.lon);
      expect(distance).toBeCloseTo(59, 1);
      expect(distance <= RADIUS).toBe(true);
    });

    it("60m fica exatamente no limite (dentro)", () => {
      const p = pointAtMetersNorth(60);
      const distance = distanceInMeters(origin.lat, origin.lon, p.lat, p.lon);
      expect(distance).toBeCloseTo(60, 1);
      // ruido de ponto flutuante na conversao metros -> graus -> metros,
      // ver comentario equivalente no teste do backend (geo.test.ts)
      expect(distance).toBeLessThanOrEqual(RADIUS + 1e-6);
    });

    it("61m fica fora do raio", () => {
      const p = pointAtMetersNorth(61);
      const distance = distanceInMeters(origin.lat, origin.lon, p.lat, p.lon);
      expect(distance).toBeCloseTo(61, 1);
      expect(distance <= RADIUS).toBe(false);
    });
  });
});
