import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import { useApiState } from "../lib/useApiState";
import type { LeaderboardEntry } from "../types";
import { AppShell } from "../components/layout/AppShell";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { JournalCard } from "../components/ui/JournalCard";
import { InkStamp } from "../components/ui/InkStamp";
import { PageState } from "../components/ui/PageState";
import { TrophyIcon } from "../icons";
import "./LeaderboardScreen.css";

export function LeaderboardScreen() {
  const { token, user } = useAuth();
  const { status, data: ranking, error, retry } = useApiState<LeaderboardEntry[]>(
    () => apiRequest<LeaderboardEntry[]>("/achievements/leaderboard", { token: token! }),
    (list) => list.length === 0,
    [token]
  );

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="diario de expedicao"
        title="Ranking de exploradores"
        subtitle="quem mais desbravou a regiao ate agora"
      />

      {status === "ready" ? (
        <section className="leaderboard-list">
          {ranking!.map((entry, index) => (
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
      ) : (
        <PageState
          status={status}
          errorMessage={error ?? undefined}
          emptyMessage="ainda nao ha exploradores no ranking."
          onRetry={retry}
        />
      )}
    </AppShell>
  );
}
