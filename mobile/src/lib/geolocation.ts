import { Geolocation } from "@capacitor/geolocation";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function getCurrentPosition(): Promise<Coordinates | null> {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 12000,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
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
