/**
 * Roteamento por estradas/trilhas reais via OSRM (servidor de demonstracao
 * publico do projeto, perfil "foot" — a app e sobre explorar a pe).
 * Uso razoavel/nao-comercial, sem garantia de uptime: por isso toda chamada
 * tem timeout curto e cai de volta pra distancia em linha reta (Haversine)
 * se falhar, em vez de quebrar a tela.
 */
const OSRM_BASE = "https://router.project-osrm.org/route/v1/foot";

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
}

export async function getWalkingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    const route = data?.routes?.[0];
    if (data?.code !== "Ok" || !route) return null;
    return { distanceMeters: route.distance, durationSeconds: route.duration };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Busca a rota de varios destinos a partir do mesmo ponto, uma de cada vez
 * (nao em paralelo) para respeitar o uso razoavel do servidor publico
 * (no maximo ~1 requisicao por segundo), chamando onResolved a cada resultado
 * para a UI atualizar progressivamente sem bloquear a tela inteira.
 */
export async function getWalkingRoutesSequential(
  from: { latitude: number; longitude: number },
  targets: { id: string; latitude: number; longitude: number }[],
  onResolved: (id: string, route: RouteResult | null) => void
): Promise<void> {
  for (const target of targets) {
    const route = await getWalkingRoute(from.latitude, from.longitude, target.latitude, target.longitude);
    onResolved(target.id, route);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
