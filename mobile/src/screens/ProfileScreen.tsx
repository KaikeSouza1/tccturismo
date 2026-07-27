import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import { useApiState } from "../lib/useApiState";
import { distanceInMeters } from "../lib/geo";
import { formatVisitDate } from "../lib/dates";
import type { Attraction, User, Visit } from "../types";
import { AppShell } from "../components/layout/AppShell";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { JournalCard } from "../components/ui/JournalCard";
import { InkStamp } from "../components/ui/InkStamp";
import { Button } from "../components/ui/Button";
import { AuthedImage } from "../components/ui/AuthedImage";
import { ExpeditionMap, type MapAttraction } from "../components/ui/ExpeditionMap";
import { CameraIcon, LogOutIcon, MedalIcon, PinIcon, TrophyIcon, UserIcon } from "../icons";
import "./ProfileScreen.css";

export function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const { status, data, retry } = useApiState<User>(
    () => apiRequest<User>("/auth/me", { token: token! }),
    () => false,
    [token]
  );
  const [mapAttractions, setMapAttractions] = useState<MapAttraction[]>([]);
  const [trailKm, setTrailKm] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);

  const profile = data ?? user;

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [attractions, visits] = await Promise.all([
        apiRequest<Attraction[]>("/attractions", { token }),
        apiRequest<Visit[]>("/visits/me", { token }).catch(() => [] as Visit[]),
      ]);

      const orderedIds: string[] = [];
      for (const visit of [...visits].sort(
        (a, b) => new Date(a.clientRecordedAt).getTime() - new Date(b.clientRecordedAt).getTime()
      )) {
        if (!orderedIds.includes(visit.attractionId)) orderedIds.push(visit.attractionId);
      }

      setMapAttractions(
        attractions.map((a) => ({
          id: a.id,
          name: a.name,
          latitude: a.latitude,
          longitude: a.longitude,
          visitOrder: orderedIds.includes(a.id) ? orderedIds.indexOf(a.id) + 1 : undefined,
        }))
      );

      const orderedAttractions = orderedIds
        .map((id) => attractions.find((a) => a.id === id))
        .filter((a): a is Attraction => Boolean(a));
      let total = 0;
      for (let i = 1; i < orderedAttractions.length; i++) {
        total += distanceInMeters(
          orderedAttractions[i - 1].latitude,
          orderedAttractions[i - 1].longitude,
          orderedAttractions[i].latitude,
          orderedAttractions[i].longitude
        );
      }
      setTrailKm(total / 1000);
      setVisitedCount(orderedAttractions.length);
      // "/visits/me" ja vem ordenado do mais recente para o mais antigo
      setRecentVisits(visits);
    })();
  }, [token]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="sua ficha de explorador(a)"
        title={profile?.name ?? "Explorador"}
        subtitle={profile?.email}
      />

      <section className="profile-content">
        {status === "error" ? (
          <div className="profile-sync-notice">
            nao foi possivel atualizar seus dados agora — mostrando a ultima versao salva.{" "}
            <button onClick={retry}>tentar de novo</button>
          </div>
        ) : null}

        <JournalCard tilt={-1} tornEdge="top" className="profile-points">
          <InkStamp variant="amber" size={58} rotate={-8}>
            <TrophyIcon size={20} />
          </InkStamp>
          <div>
            <strong>{profile?.points ?? 0} pontos</strong>
            <p>acumulados visitando atrativos e coletando carimbos</p>
          </div>
        </JournalCard>

        {mapAttractions.length > 0 ? (
          <JournalCard tilt={0.6} tornEdge="top" className="profile-map">
            <h3 className="profile-map__heading">seu mapa de expedicao</h3>
            <ExpeditionMap attractions={mapAttractions} height={220} />
            <p className="profile-map__legend">
              {visitedCount > 1
                ? `voce ja percorreu ~${trailKm.toFixed(1)}km entre ${visitedCount} pontos da cidade`
                : visitedCount === 1
                  ? "voce carimbou seu primeiro ponto — o mapa comeca a ganhar tinta"
                  : "carimbe seu primeiro atrativo para comecar a desenhar seu mapa"}
            </p>
          </JournalCard>
        ) : null}

        {recentVisits.length > 0 ? (
          <section className="profile-visits">
            <h3 className="profile-visits__heading">minhas visitas</h3>
            <div className="profile-visits__list">
              {recentVisits.map((visit) => (
                <JournalCard key={visit.id} tornEdge="none" className="profile-visits__entry">
                  <div className="profile-visits__thumb">
                    {visit.hasPhoto ? (
                      <AuthedImage path={`/visits/${visit.id}/photo`} alt="" />
                    ) : (
                      <PinIcon size={18} />
                    )}
                  </div>
                  <div className="profile-visits__text">
                    <strong>{visit.attractionName}</strong>
                    <span>{formatVisitDate(visit.clientRecordedAt)}</span>
                  </div>
                  <span className="profile-visits__distance">{Math.round(visit.distanceMeters)}m</span>
                  {visit.hasPhoto ? (
                    <span className="profile-visits__photo-badge">
                      <CameraIcon size={12} />
                    </span>
                  ) : null}
                </JournalCard>
              ))}
            </div>
          </section>
        ) : null}

        <div className="profile-menu">
          <button className="profile-menu__item" onClick={() => navigate("/achievements")}>
            <MedalIcon size={20} />
            <span>Minhas conquistas</span>
          </button>
          <button className="profile-menu__item" onClick={() => navigate("/leaderboard")}>
            <UserIcon size={20} />
            <span>Ranking de exploradores</span>
          </button>
        </div>

        <Button variant="outline" fullWidth icon={<LogOutIcon size={18} />} onClick={handleLogout}>
          Sair da conta
        </Button>
      </section>
    </AppShell>
  );
}
