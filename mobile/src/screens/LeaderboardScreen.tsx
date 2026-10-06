import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import { useApiState } from "../lib/useApiState";
import type { Attraction, LeaderboardEntry, OrganizationLeaderboardEntry, Visit } from "../types";
import { AppShell } from "../components/layout/AppShell";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { JournalCard } from "../components/ui/JournalCard";
import { InkStamp } from "../components/ui/InkStamp";
import { PageState } from "../components/ui/PageState";
import { TrophyIcon } from "../icons";
import "./LeaderboardScreen.css";

type Mode = "general" | "organization";

interface OrgOption {
  organizationId: string;
  organizationName: string;
}

export function LeaderboardScreen() {
  const { token, user } = useAuth();
  const [mode, setMode] = useState<Mode>("general");
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  // Carrega a lista de organizacoes (a partir dos atrativos publicos, ja que
  // nao ha endpoint de organizacoes acessivel pra turista) e sugere a ultima
  // organizacao visitada como selecao inicial.
  useEffect(() => {
    if (!token) return;
    (async () => {
      const attractions = await apiRequest<Attraction[]>("/attractions", { token }).catch(() => []);
      const uniqueOrgs = new Map<string, string>();
      for (const a of attractions) uniqueOrgs.set(a.organizationId, a.organizationName);
      const options = [...uniqueOrgs.entries()]
        .map(([organizationId, organizationName]) => ({ organizationId, organizationName }))
        .sort((a, b) => a.organizationName.localeCompare(b.organizationName));
      setOrgOptions(options);

      let defaultOrgId = options[0]?.organizationId ?? "";
      const visits = await apiRequest<Visit[]>("/visits/me", { token }).catch(() => []);
      if (visits.length > 0) {
        const mostRecent = [...visits].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        const attraction = attractions.find((a) => a.id === mostRecent.attractionId);
        if (attraction) defaultOrgId = attraction.organizationId;
      }
      setSelectedOrgId((current) => current || defaultOrgId);
    })();
  }, [token]);

  const general = useApiState<LeaderboardEntry[]>(
    () => apiRequest<LeaderboardEntry[]>("/achievements/leaderboard", { token: token! }),
    (list) => list.length === 0,
    [token]
  );

  const organization = useApiState<OrganizationLeaderboardEntry[]>(
    () =>
      selectedOrgId
        ? apiRequest<OrganizationLeaderboardEntry[]>(
            `/achievements/leaderboard?organizationId=${selectedOrgId}`,
            { token: token! }
          )
        : Promise.resolve([]),
    (list) => list.length === 0,
    [token, selectedOrgId]
  );

  const active = mode === "general" ? general : organization;

  const selectedOrgName = useMemo(
    () => orgOptions.find((o) => o.organizationId === selectedOrgId)?.organizationName,
    [orgOptions, selectedOrgId]
  );

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="diario de expedicao"
        title="Ranking de exploradores"
        subtitle={
          mode === "general"
            ? "quem mais desbravou a regiao ate agora"
            : selectedOrgName
              ? `quem mais visitou atrativos em ${selectedOrgName}`
              : "escolha uma organizacao"
        }
      />

      <div className="leaderboard-tabs">
        <button
          type="button"
          className={`leaderboard-tabs__item ${mode === "general" ? "is-active" : ""}`}
          onClick={() => setMode("general")}
        >
          Ranking geral
        </button>
        <button
          type="button"
          className={`leaderboard-tabs__item ${mode === "organization" ? "is-active" : ""}`}
          onClick={() => setMode("organization")}
        >
          Por organizacao
        </button>
      </div>

      {mode === "organization" && orgOptions.length > 0 ? (
        <select
          className="leaderboard-org-select"
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
        >
          {orgOptions.map((o) => (
            <option key={o.organizationId} value={o.organizationId}>
              {o.organizationName}
            </option>
          ))}
        </select>
      ) : null}

      {mode === "general" && general.status === "ready" ? (
        <section className="leaderboard-list">
          {general.data!.map((entry, index) => (
            <div className="rise-in" style={{ animationDelay: `${index * 60}ms` }} key={entry.id}>
              <JournalCard
                tilt={index % 2 === 0 ? -1.2 : 1}
                tornEdge="none"
                className={`leaderboard-row ${entry.id === user?.id ? "leaderboard-row--me" : ""}`}
              >
                {entry.rank <= 3 ? (
                  <InkStamp
                    variant={entry.rank === 1 ? "amber" : "ink"}
                    size={44}
                    rotate={entry.rank === 1 ? -6 : 6}
                  >
                    <TrophyIcon size={16} />
                  </InkStamp>
                ) : (
                  <span className="leaderboard-row__rank">{entry.rank}</span>
                )}
                <div className="leaderboard-row__body">
                  <strong>{entry.name}</strong>
                  <span>{entry.achievementsCount} carimbo(s) coletado(s)</span>
                </div>
                <span className="leaderboard-row__points">{entry.points} pts</span>
              </JournalCard>
            </div>
          ))}
        </section>
      ) : null}

      {mode === "organization" && organization.status === "ready" ? (
        <section className="leaderboard-list">
          {organization.data!.map((entry, index) => (
            <div className="rise-in" style={{ animationDelay: `${index * 60}ms` }} key={entry.id}>
              <JournalCard
                tilt={index % 2 === 0 ? -1.2 : 1}
                tornEdge="none"
                className={`leaderboard-row ${entry.id === user?.id ? "leaderboard-row--me" : ""}`}
              >
                {entry.rank <= 3 ? (
                  <InkStamp
                    variant={entry.rank === 1 ? "amber" : "ink"}
                    size={44}
                    rotate={entry.rank === 1 ? -6 : 6}
                  >
                    <TrophyIcon size={16} />
                  </InkStamp>
                ) : (
                  <span className="leaderboard-row__rank">{entry.rank}</span>
                )}
                <div className="leaderboard-row__body">
                  <strong>{entry.name}</strong>
                </div>
                <span className="leaderboard-row__points">
                  {entry.visitsCount} {entry.visitsCount === 1 ? "visita" : "visitas"}
                </span>
              </JournalCard>
            </div>
          ))}
        </section>
      ) : null}

      {active.status !== "ready" ? (
        <PageState
          status={active.status}
          errorMessage={active.error ?? undefined}
          emptyMessage={
            mode === "general"
              ? "ainda nao ha exploradores no ranking."
              : "ninguem visitou atrativos desta organizacao ainda."
          }
          onRetry={active.retry}
        />
      ) : null}
    </AppShell>
  );
}
