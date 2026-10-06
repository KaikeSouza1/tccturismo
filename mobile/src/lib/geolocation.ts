import { Geolocation } from "@capacitor/geolocation";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationErrorReason = "permission" | "disabled" | "timeout" | "unavailable" | "unknown";

export interface LocationResult {
  coords: Coordinates | null;
  errorReason: LocationErrorReason | null;
}

/**
 * O plugin @capacitor/geolocation nao expoe um codigo de erro tipado pro
 * lado JS — so a mensagem (em ingles, definida nativamente em
 * GeolocationErrors.kt no Android). Classifica por essas strings conhecidas
 * para poder mostrar uma orientacao especifica em vez de um erro generico.
 */
function classifyGeolocationError(err: unknown): LocationErrorReason {
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (message.includes("permission")) return "permission";
  if (message.includes("disabled") || message.includes("not enabled") || message.includes("turned off")) {
    return "disabled";
  }
  if (message.includes("timeout") || message.includes("in time")) return "timeout";
  if (message.includes("unavailable") || message.includes("error trying to obtain")) return "unavailable";
  return "unknown";
}

async function fetchPosition(): Promise<LocationResult> {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 12000,
    });
    return {
      coords: { latitude: position.coords.latitude, longitude: position.coords.longitude },
      errorReason: null,
    };
  } catch (err) {
    return { coords: null, errorReason: classifyGeolocationError(err) };
  }
}

/** Uso geral (Home, detalhe do atrativo): so precisa saber se deu certo ou nao. */
export async function getCurrentPosition(): Promise<Coordinates | null> {
  const result = await fetchPosition();
  return result.coords;
}

/** Uso onde a causa da falha importa pro usuario (ex: tela de scan). */
export async function getCurrentPositionDetailed(): Promise<LocationResult> {
  return fetchPosition();
}

export function locationErrorMessage(reason: LocationErrorReason): string {
  switch (reason) {
    case "permission":
      return "Permissao de localizacao negada. Ative o acesso a localizacao nas configuracoes do app.";
    case "disabled":
      return "Localizacao desligada. Ative o GPS nas configuracoes do aparelho.";
    case "timeout":
      return "Nao foi possivel obter sua localizacao a tempo. Va a um local aberto e tente novamente.";
    case "unavailable":
      return "Localizacao indisponivel no momento. Tente novamente em instantes.";
    default:
      return "Nao foi possivel obter sua localizacao. Ative o GPS e tente novamente.";
  }
}

/**
 * Observa a posicao continuamente ate clearWatch ser chamado. Usado na
 * bussola de aproximacao, onde a distancia precisa ser recalculada em tempo
 * real enquanto o turista caminha ate o atrativo.
 */
export async function watchPosition(
  onChange: (coords: Coordinates) => void
): Promise<string | null> {
  try {
    return await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 12000 },
      (position) => {
        if (position) {
          onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        }
      }
    );
  } catch {
    return null;
  }
}

export async function clearWatch(watchId: string): Promise<void> {
  try {
    await Geolocation.clearWatch({ id: watchId });
  } catch {
    // ignora - watch pode ja ter sido limpo
  }
}
