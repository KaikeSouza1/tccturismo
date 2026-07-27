import { useCallback, useRef, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { apiRequest, ApiError } from "../lib/api";
import { useQrScanner } from "../lib/useQrScanner";
import { getCurrentPosition } from "../lib/geolocation";
import { distanceInMeters } from "../lib/geo";
import { getCachedAttractions, enqueuePendingVisit } from "../lib/offline-queue";
import { haptics } from "../lib/haptics";
import type { Achievement, Visit } from "../types";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { AchievementCelebration } from "../components/ui/AchievementCelebration";
import { InkStamp } from "../components/ui/InkStamp";
import { Polaroid } from "../components/ui/Polaroid";
import { CheckIcon, PinIcon, XIcon } from "../icons";
import "./ScanScreen.css";

type ScanState =
  | { kind: "scanning" }
  | { kind: "processing"; recognizedName?: string }
  | { kind: "success"; visit: Visit; unlockedAchievements: Achievement[]; frameDataUrl: string }
  | { kind: "queued"; attractionName?: string }
  | { kind: "error"; message: string };

function parseQrPayload(raw: string): { attractionId?: string; qrToken: string } {
  const separatorIndex = raw.indexOf(".");
  if (separatorIndex === -1) {
    return { qrToken: raw };
  }
  return {
    attractionId: raw.slice(0, separatorIndex),
    qrToken: raw.slice(separatorIndex + 1),
  };
}

export function ScanScreen() {
  const { token } = useAuth();
  const [state, setState] = useState<ScanState>({ kind: "scanning" });
  const processingRef = useRef(false);

  const handleDetected = useCallback(
    async (raw: string, frameDataUrl: string) => {
      if (processingRef.current || !token) return;
      processingRef.current = true;

      const { attractionId, qrToken } = parseQrPayload(raw);

      // Reconhece o local pelo cache local na hora, antes mesmo da resposta
      // do servidor chegar — o turista ve na hora qual lugar acabou de
      // encontrar, em vez de so um texto generico de "confirmando".
      const recognized = attractionId
        ? (await getCachedAttractions()).find((a) => a.id === attractionId)
        : undefined;
      setState({ kind: "processing", recognizedName: recognized?.name });

      const position = await getCurrentPosition();

      if (!position) {
        setState({
          kind: "error",
          message: "Nao foi possivel obter sua localizacao. Ative o GPS e tente novamente.",
        });
        return;
      }

      const clientRecordedAt = new Date().toISOString();

      try {
        const result = await apiRequest<{ visit: Visit; unlockedAchievements: Achievement[] }>(
          "/visits",
          {
            method: "POST",
            token,
            body: { qrToken, latitude: position.latitude, longitude: position.longitude, clientRecordedAt },
          }
        );
        setState({
          kind: "success",
          visit: result.visit,
          unlockedAchievements: result.unlockedAchievements,
          frameDataUrl,
        });
        haptics.stamp();
      } catch (err) {
        if (err instanceof ApiError) {
          setState({ kind: "error", message: err.message });
          return;
        }

        const cached = recognized;

        if (cached) {
          const distance = distanceInMeters(
            position.latitude,
            position.longitude,
            cached.latitude,
            cached.longitude
          );
          if (distance > cached.radiusMeters) {
            setState({
              kind: "error",
              message: `Voce esta a ${Math.round(distance)}m de "${cached.name}". Aproxime-se ate ${cached.radiusMeters}m.`,
            });
            return;
          }
        }

        await enqueuePendingVisit({
          localId: crypto.randomUUID(),
          qrToken,
          latitude: position.latitude,
          longitude: position.longitude,
          clientRecordedAt,
          attractionNameGuess: cached?.name,
        });
        setState({ kind: "queued", attractionName: cached?.name });
      }
    },
    [token]
  );

  const { videoRef, error: cameraError, ready } = useQrScanner({
    active: state.kind === "scanning",
    onDetected: handleDetected,
  });

  function reset() {
    processingRef.current = false;
    setState({ kind: "scanning" });
  }

  return (
    <AppShell>
      <div className="scan-screen">
        {state.kind === "scanning" || state.kind === "processing" ? (
          <div className="scan-camera">
            <video ref={videoRef} className="scan-camera__video" playsInline muted />
            <div className="scan-camera__overlay">
              <div className="scan-camera__frame">
                <span className="scan-camera__corner scan-camera__corner--tl" />
                <span className="scan-camera__corner scan-camera__corner--tr" />
                <span className="scan-camera__corner scan-camera__corner--bl" />
                <span className="scan-camera__corner scan-camera__corner--br" />
                {state.kind === "scanning" && ready ? <span className="scan-camera__scanline" /> : null}
              </div>
              <p className="scan-camera__hint">
                {state.kind === "processing"
                  ? "Confirmando sua localizacao..."
                  : ready
                    ? "Aponte a camera para o QR Code do atrativo"
                    : "Iniciando camera..."}
              </p>
            </div>
            {state.kind === "processing" && state.recognizedName ? (
              <div className="scan-camera__recognized pop-in">
                <InkStamp variant="success" size={40} rotate={-6}>
                  <PinIcon size={15} />
                </InkStamp>
                <span>voce encontrou: {state.recognizedName}</span>
              </div>
            ) : null}
            {cameraError ? <div className="scan-camera__error">{cameraError}</div> : null}
          </div>
        ) : (
          <div className="scan-result">
            {state.kind === "success" ? (
              <>
                <div className="scan-success__frame">
                  <div className="scan-success__flash" />
                  <Polaroid
                    size={210}
                    tilt={-2}
                    caption={state.visit.attractionName}
                    photoClassName="scan-success__photo-reveal"
                  >
                    <img src={state.frameDataUrl} className="scan-success__img" alt="" />
                  </Polaroid>
                  <div className="scan-success__stamp stamp-slam-in">
                    <InkStamp variant="impact" size={86} rotate={-9} label="visitado">
                      <CheckIcon size={28} />
                    </InkStamp>
                  </div>
                </div>
                <h2>Visita carimbada!</h2>
                <p className="scan-result__detail scan-result__detail--hand">
                  distancia confirmada: {state.visit.distanceMeters}m do ponto oficial
                </p>
                <Button fullWidth onClick={reset}>
                  Escanear outro atrativo
                </Button>
              </>
            ) : null}

            {state.kind === "queued" ? (
              <>
                <div className="pop-in">
                  <InkStamp variant="ink" size={92} rotate={6} label="pendente">
                    <PinIcon size={26} />
                  </InkStamp>
                </div>
                <h2>Visita salva no caderno</h2>
                <p className="scan-result__detail scan-result__detail--hand">
                  sem conexao no momento{state.attractionName ? ` em ${state.attractionName}` : ""} — assim que
                  voce estiver online, a visita e enviada e confirmada sozinha
                </p>
                <Button fullWidth onClick={reset}>
                  Escanear outro atrativo
                </Button>
              </>
            ) : null}

            {state.kind === "error" ? (
              <>
                <div className="pop-in">
                  <InkStamp variant="locked" size={92} rotate={8} label="recusado">
                    <XIcon size={26} />
                  </InkStamp>
                </div>
                <h2>Nao foi possivel registrar</h2>
                <p className="scan-result__detail scan-result__detail--hand">{state.message}</p>
                <Button fullWidth onClick={reset}>
                  Tentar novamente
                </Button>
              </>
            ) : null}
          </div>
        )}
      </div>

      {state.kind === "success" && state.unlockedAchievements.length > 0 ? (
        <AchievementCelebration achievements={state.unlockedAchievements} onDismiss={reset} />
      ) : null}
    </AppShell>
  );
}
