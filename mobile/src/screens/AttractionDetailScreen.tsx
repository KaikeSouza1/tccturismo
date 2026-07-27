import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { apiRequest, attractionGalleryImageUrl } from "../lib/api";
import { clearWatch, getCurrentPosition, watchPosition } from "../lib/geolocation";
import { distanceInMeters } from "../lib/geo";
import { getWalkingRoute } from "../lib/osrm";
import { formatVisitDate } from "../lib/dates";
import { haptics } from "../lib/haptics";
import type { Attraction, Visit } from "../types";
import { AppShell } from "../components/layout/AppShell";
import { JournalCard } from "../components/ui/JournalCard";
import { InkStamp } from "../components/ui/InkStamp";
import { Polaroid } from "../components/ui/Polaroid";
import { WashiTape } from "../components/ui/WashiTape";
import { AttractionArt } from "../components/ui/AttractionArt";
import { ChevronLeftIcon, ChevronRightIcon, CompassIcon, PinIcon, RouteIcon } from "../icons";
import "./AttractionDetailScreen.css";

const CATEGORY_LABEL: Record<string, string> = {
  cultural: "cultural",
  historico: "historico",
  natureza: "natureza",
  lazer: "lazer",
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m daqui`;
  return `${(meters / 1000).toFixed(1)}km daqui`;
}

function ordinalVisit(n: number): string {
  return `${n}ª visita`;
}

export function AttractionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [galleryIds, setGalleryIds] = useState<string[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [pastVisits, setPastVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [coordsRevealed, setCoordsRevealed] = useState(false);
  const [liveDistance, setLiveDistance] = useState<number | null>(null);
  const [insideRadius, setInsideRadius] = useState(false);
  const distanceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token || !id) return;

    (async () => {
      const [found, position, visits] = await Promise.all([
        apiRequest<Attraction>(`/attractions/${id}`, { token }),
        getCurrentPosition(),
        apiRequest<Visit[]>("/visits/me", { token }).catch(() => []),
      ]);

      setAttraction(found);
      if (found.hasImage) {
        apiRequest<{ id: string }[]>(`/attractions/${id}/images`)
          .then((images) => setGalleryIds(images.map((i) => i.id)))
          .catch(() => {});
      }
      if (position) {
        setDistance(distanceInMeters(position.latitude, position.longitude, found.latitude, found.longitude));
        // Distancia real por estradas/trilhas (OSRM) so para o card
        // informativo "tracar rota" — a bussola de aproximacao abaixo
        // continua em linha reta, que e o que importa para o geofencing.
        getWalkingRoute(position.latitude, position.longitude, found.latitude, found.longitude).then(
          (route) => {
            if (route) setRouteDistance(route.distanceMeters);
          }
        );
      }
      const ordered = visits
        .filter((v) => v.attractionId === id)
        .sort((a, b) => new Date(a.clientRecordedAt).getTime() - new Date(b.clientRecordedAt).getTime());
      setPastVisits(ordered);
      setLoading(false);
    })();
  }, [id, token]);

  const visitCount = pastVisits.length;
  const maxRange = attraction ? attraction.radiusMeters * 6 : 0;
  const approaching =
    attraction !== null && distance !== null && distance > attraction.radiusMeters && distance <= maxRange;

  // Bussola de aproximacao: enquanto o atrativo esta por perto mas fora do
  // raio de validacao, observa a posicao continuamente e da feedback tatil
  // que se intensifica conforme a distancia diminui.
  useEffect(() => {
    if (!approaching || !attraction) return;

    distanceRef.current = distance;
    let cancelled = false;
    let crossed = false;
    let pulseTimeout: ReturnType<typeof setTimeout> | null = null;
    let watchId: string | null = null;

    function schedulePulse() {
      const current = distanceRef.current;
      if (current === null || crossed) return;
      const progress = Math.min(
        Math.max(1 - (current - attraction!.radiusMeters) / (maxRange - attraction!.radiusMeters), 0),
        1
      );
      const interval = 2200 - progress * 1800;
      pulseTimeout = setTimeout(() => {
        if (cancelled || crossed) return;
        haptics.light();
        schedulePulse();
      }, interval);
    }

    (async () => {
      watchId = await watchPosition((coords) => {
        if (cancelled) return;
        const d = distanceInMeters(coords.latitude, coords.longitude, attraction!.latitude, attraction!.longitude);
        distanceRef.current = d;
        setLiveDistance(d);
        if (d <= attraction!.radiusMeters && !crossed) {
          crossed = true;
          setInsideRadius(true);
          haptics.heavy();
          if (pulseTimeout) clearTimeout(pulseTimeout);
        }
      });
      schedulePulse();
    })();

    return () => {
      cancelled = true;
      if (pulseTimeout) clearTimeout(pulseTimeout);
      if (watchId) clearWatch(watchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approaching, attraction]);

  const compassDistance = liveDistance ?? distance;
  const compassProgress =
    attraction && compassDistance !== null
      ? Math.min(Math.max(1 - (compassDistance - attraction.radiusMeters) / (maxRange - attraction.radiusMeters), 0), 1)
      : 0;

  return (
    <AppShell>
      <div className="detail-topbar">
        <button className="detail-topbar__back" onClick={() => navigate(-1)}>
          <ChevronLeftIcon size={20} />
          <span>voltar</span>
        </button>
      </div>

      {loading || !attraction ? (
        <p className="home-empty">carregando pagina do atrativo...</p>
      ) : (
        <div className="detail-content">
          <div className="detail-hero">
            <WashiTape
              color="kraft"
              rotate={8}
              width={78}
              top={-6}
              right={44}
              interactive
              onReveal={() => setCoordsRevealed(true)}
            />
            <Polaroid size={168} tilt={-2} caption={CATEGORY_LABEL[attraction.category ?? ""] ?? "atrativo"}>
              <AttractionArt attraction={attraction} size={168} />
            </Polaroid>
            <p className={`detail-hero__coords ${coordsRevealed ? "detail-hero__coords--visible" : ""}`}>
              {coordsRevealed
                ? `coordenadas exatas: ${attraction.latitude.toFixed(4)}, ${attraction.longitude.toFixed(4)}`
                : "puxe a fita para revelar as coordenadas"}
            </p>

            {approaching ? (
              <div className="detail-compass">
                <div
                  className={`detail-compass__ring ${insideRadius ? "detail-compass__ring--hot" : ""}`}
                  style={{ ["--compass-progress" as string]: compassProgress }}
                >
                  <div className="detail-compass__inner">
                    <CompassIcon size={22} />
                  </div>
                </div>
                <span className="detail-compass__label">
                  {insideRadius
                    ? "voce chegou! abra o scanner"
                    : compassDistance !== null
                      ? `${Math.round(compassDistance)}m — esquentando`
                      : "calculando distancia..."}
                </span>
              </div>
            ) : null}
          </div>

          {galleryIds.length > 1 ? (
            <div className="detail-gallery">
              {galleryIds.slice(1).map((imageId) => (
                <Polaroid key={imageId} size={72} tilt={0}>
                  <img
                    src={attractionGalleryImageUrl(attraction.id, imageId)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Polaroid>
              ))}
            </div>
          ) : null}

          <h1 className="detail-title">{attraction.name}</h1>

          {visitCount > 0 ? (
            <div className="detail-visited">
              <InkStamp variant="success" size={40} rotate={-8}>
                <PinIcon size={15} />
              </InkStamp>
              <span>
                voce ja visitou {visitCount > 1 ? `${visitCount} vezes` : "este lugar"}
              </span>
            </div>
          ) : null}

          <JournalCard tilt={-0.6} tornEdge="top" className="detail-card">
            <h3 className="detail-card__heading">sobre este lugar</h3>
            <p className="detail-card__description">
              {attraction.description ?? "Sem descricao cadastrada ainda."}
            </p>
          </JournalCard>

          <div className="detail-stats">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${attraction.latitude},${attraction.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-stat-link"
            >
              <JournalCard tilt={0.8} tornEdge="none" className="detail-stat detail-stat--action">
                <RouteIcon size={18} />
                <div>
                  <strong>
                    {routeDistance !== null
                      ? formatDistance(routeDistance)
                      : distance !== null
                        ? formatDistance(distance)
                        : "tracar rota"}
                  </strong>
                  <span>abrir no app de mapas</span>
                </div>
                <ChevronRightIcon size={16} className="detail-stat__chevron" />
              </JournalCard>
            </a>
            <JournalCard tilt={-0.8} tornEdge="none" className="detail-stat">
              <PinIcon size={18} />
              <div>
                <strong>raio de {attraction.radiusMeters}m</strong>
                <span>necessario para carimbar</span>
              </div>
            </JournalCard>
          </div>

          {pastVisits.length > 0 ? (
            <section className="detail-history">
              <h3 className="detail-history__heading">seu historico aqui</h3>
              <div className="detail-history__list">
                {pastVisits.map((visit, index) => (
                  <JournalCard
                    key={visit.id}
                    tilt={index % 2 === 0 ? -0.8 : 0.8}
                    tornEdge="none"
                    className="detail-history__entry"
                  >
                    <span className="detail-history__ordinal">{ordinalVisit(index + 1)}</span>
                    <span className="detail-history__date">{formatVisitDate(visit.clientRecordedAt)}</span>
                    <span className="detail-history__distance">
                      confirmado a {Math.round(visit.distanceMeters)}m do ponto oficial
                    </span>
                  </JournalCard>
                ))}
              </div>
            </section>
          ) : null}

          <p className="detail-hint">
            chegue perto do local, abra o scanner e aponte a camera para o QR Code fixado no atrativo para
            carimbar sua visita.
          </p>
        </div>
      )}
    </AppShell>
  );
}
