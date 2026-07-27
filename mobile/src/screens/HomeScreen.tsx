import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import { cacheAttractions, getCachedAttractions, getPendingVisits } from "../lib/offline-queue";
import { getCurrentPosition } from "../lib/geolocation";
import { distanceInMeters } from "../lib/geo";
import { getWalkingRoutesSequential } from "../lib/osrm";
import { syncPendingVisits } from "../lib/sync";
import type { Attraction, Visit } from "../types";
import { AppShell } from "../components/layout/AppShell";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { JournalCard } from "../components/ui/JournalCard";
import { WashiTape } from "../components/ui/WashiTape";
import { Polaroid } from "../components/ui/Polaroid";
import { ExpeditionMap, type MapAttraction } from "../components/ui/ExpeditionMap";
import { AttractionArt } from "../components/ui/AttractionArt";
import { PinIcon, RouteIcon } from "../icons";
import "./HomeScreen.css";

const CATEGORY_LABEL: Record<string, string> = {
  cultural: "cultural",
  historico: "historico",
  natureza: "natureza",
  lazer: "lazer",
};

const TILTS = [-2, 1.6, -1.2, 2.2, -1.8, 1.2];

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m daqui`;
  return `${(meters / 1000).toFixed(1)}km daqui`;
}

type AttractionWithDistance = Attraction & { distance?: number };

export function HomeScreen() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [attractions, setAttractions] = useState<AttractionWithDistance[]>([]);
  const [routeDistances, setRouteDistances] = useState<Record<string, number>>({});
  const [mapAttractions, setMapAttractions] = useState<MapAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!token) return;

    (async () => {
      let list: Attraction[] = [];
      try {
        list = await apiRequest<Attraction[]>("/attractions", { token });
        await cacheAttractions(list);
        setOffline(false);
      } catch {
        list = await getCachedAttractions();
        setOffline(true);
      }

      const position = await getCurrentPosition();
      const withDistance = list.map((attraction) => ({
        ...attraction,
        distance: position
          ? distanceInMeters(position.latitude, position.longitude, attraction.latitude, attraction.longitude)
          : undefined,
      }));
      withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

      setAttractions(withDistance);
      setLoading(false);

      // Distancia em linha reta ja aparece na hora (ordena a lista); em
      // seguida busca a distancia real por estradas/trilhas via OSRM, uma
      // atracao de cada vez, e vai substituindo o numero mostrado conforme
      // cada rota chega — sem bloquear a tela nem reordenar os cartoes.
      if (position) {
        getWalkingRoutesSequential(
          position,
          withDistance.map((a) => ({ id: a.id, latitude: a.latitude, longitude: a.longitude })),
          (id, route) => {
            if (!route) return;
            setRouteDistances((prev) => ({ ...prev, [id]: route.distanceMeters }));
          }
        );
      }

      apiRequest<Visit[]>("/visits/me", { token })
        .then((visits) => {
          const orderedIds: string[] = [];
          for (const visit of [...visits].sort(
            (a, b) => new Date(a.clientRecordedAt).getTime() - new Date(b.clientRecordedAt).getTime()
          )) {
            if (!orderedIds.includes(visit.attractionId)) orderedIds.push(visit.attractionId);
          }
          setMapAttractions(
            list.map((a) => ({
              id: a.id,
              name: a.name,
              latitude: a.latitude,
              longitude: a.longitude,
              visitOrder: orderedIds.includes(a.id) ? orderedIds.indexOf(a.id) + 1 : undefined,
            }))
          );
        })
        .catch(() => {});

      const pending = await getPendingVisits();
      setPendingCount(pending.length);

      if (pending.length > 0) {
        const result = await syncPendingVisits(token);
        if (result.syncedCount > 0) {
          const refreshed = await getPendingVisits();
          setPendingCount(refreshed.length);
        }
      }
    })();
  }, [token]);

  const firstName = user?.name.split(" ")[0] ?? "explorador(a)";
  const [featured, ...rest] = attractions;

  function displayDistance(attraction: AttractionWithDistance): number | undefined {
    return routeDistances[attraction.id] ?? attraction.distance;
  }

  // Agrupa o restante por organizacao/cidade em vez de uma unica grade
  // indiferenciada — com mais de um municipio na plataforma, misturar tudo
  // numa lista so deixa de fazer sentido para o turista.
  const chapters = useMemo(() => {
    const groups = new Map<string, AttractionWithDistance[]>();
    for (const attraction of rest) {
      const key = attraction.organizationName;
      const list = groups.get(key) ?? [];
      list.push(attraction);
      groups.set(key, list);
    }
    return [...groups.entries()]
      .map(([name, items]) => ({
        name,
        items,
        minDistance: Math.min(...items.map((item) => item.distance ?? Infinity)),
      }))
      .sort((a, b) => a.minDistance - b.minDistance);
  }, [rest]);

  return (
    <AppShell>
      <ScreenHeader
        eyebrow={`ola, ${firstName}`}
        title="Atrativos por perto"
        subtitle="Escaneie o QR Code no local para carimbar sua visita"
        action={
          <button className="home-map-toggle" onClick={() => setShowMap((v) => !v)}>
            {showMap ? <PinIcon size={15} /> : <RouteIcon size={15} />}
            <span>{showMap ? "ver lista" : "ver no mapa"}</span>
          </button>
        }
      />

      <section className="home-list">
        {offline ? (
          <div className="home-banner home-banner--offline">
            sem conexao — mostrando o que ja foi salvo no seu caderno
          </div>
        ) : null}

        {pendingCount > 0 ? (
          <div className="home-banner home-banner--pending">
            {pendingCount} visita(s) aguardando confirmacao do servidor
          </div>
        ) : null}

        {loading ? (
          <p className="home-empty">carregando atrativos...</p>
        ) : attractions.length === 0 ? (
          <p className="home-empty">nenhum atrativo cadastrado ainda.</p>
        ) : showMap ? (
          <JournalCard tilt={0} tornEdge="top" className="home-map-card">
            <ExpeditionMap
              attractions={mapAttractions}
              width={300}
              height={230}
              onSelectAttraction={(id) => navigate(`/attractions/${id}`)}
            />
            <p className="home-map-card__hint">toque em um pino carimbado para ver a pagina do atrativo</p>
          </JournalCard>
        ) : (
          <>
            <div className="home-feature-pin rise-in">
              <WashiTape color="blue" rotate={-3} width={140} top={-13} left={-10} />
              <article
                className="home-feature"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/attractions/${featured.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/attractions/${featured.id}`);
                }}
              >
                {displayDistance(featured) !== undefined ? (
                  <span className="home-feature__kicker">
                    mais perto de voce — {formatDistance(displayDistance(featured)!)}
                  </span>
                ) : null}
                <div className="home-feature__scene">
                  <AttractionArt attraction={featured} size={240} />
                </div>
                <h2 className="home-feature__title">{featured.name}</h2>
                {featured.description ? (
                  <p className="home-feature__description">{featured.description}</p>
                ) : null}
                <div className="home-feature__tags">
                  <span className="attraction-card__radius">raio {featured.radiusMeters}m</span>
                  <span className="attraction-card__radius">
                    {CATEGORY_LABEL[featured.category ?? ""] ?? "atrativo"}
                  </span>
                </div>
              </article>
            </div>

            {chapters.map((chapter, chapterIndex) => (
              <section
                className="home-chapter rise-in"
                style={{ animationDelay: `${Math.min(chapterIndex + 1, 4) * 90}ms` }}
                key={chapter.name}
              >
                <div className="home-chapter__header">
                  <span className="home-chapter__pin">
                    <PinIcon size={13} />
                  </span>
                  <h3 className="home-chapter__title">{chapter.name}</h3>
                  <span className="home-chapter__count">
                    {chapter.items.length} {chapter.items.length > 1 ? "atrativos" : "atrativo"}
                  </span>
                </div>

                <div className="home-chapter__shelf">
                  {chapter.items.map((attraction, index) => (
                    <article
                      className="home-shelf-card"
                      role="button"
                      tabIndex={0}
                      key={attraction.id}
                      onClick={() => navigate(`/attractions/${attraction.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") navigate(`/attractions/${attraction.id}`);
                      }}
                    >
                      <Polaroid size={96} tilt={TILTS[index % TILTS.length]}>
                        <AttractionArt attraction={attraction} size={96} />
                      </Polaroid>
                      <strong>{attraction.name}</strong>
                      {displayDistance(attraction) !== undefined ? (
                        <span>{formatDistance(displayDistance(attraction)!)}</span>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </section>
    </AppShell>
  );
}
