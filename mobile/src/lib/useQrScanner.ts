import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

interface UseQrScannerOptions {
  active: boolean;
  onDetected: (rawValue: string, frameDataUrl: string) => void;
}

export function useQrScanner({ active, onDetected }: UseQrScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const frameRequestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    setError(null);
    setReady(false);

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          await video.play();
          setReady(true);
          tick();

          // Alguns WebViews Android pausam a tag <video> sozinhos (perda de
          // foco, economia de energia, etc.) e mostram o icone nativo de
          // play por cima da imagem parada. Como isso e so uma pre-visualizacao
          // de camera, nao um video de verdade, ela deve simplesmente retomar
          // sozinha sempre que isso acontecer enquanto a tela de scan estiver ativa.
          video.onpause = () => {
            if (!cancelled) video.play().catch(() => {});
          };
        }
      } catch {
        setError("Nao foi possivel acessar a camera. Verifique as permissoes do navegador/app.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        frameRequestRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        frameRequestRef.current = requestAnimationFrame(tick);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        const frameDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        onDetected(code.data, frameDataUrl);
        return;
      }

      frameRequestRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      if (frameRequestRef.current) cancelAnimationFrame(frameRequestRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { videoRef, error, ready };
}
