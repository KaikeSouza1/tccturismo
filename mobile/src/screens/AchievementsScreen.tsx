import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import { useApiState } from "../lib/useApiState";
import { getRarity, RARITY_LABEL } from "../lib/rarity";
import type { Achievement } from "../types";
import { AppShell } from "../components/layout/AppShell";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { JournalCard } from "../components/ui/JournalCard";
import { InkStamp } from "../components/ui/InkStamp";
import { PageState } from "../components/ui/PageState";
import { MedalIcon } from "../icons";
import "./AchievementsScreen.css";

const TILTS = [1.4, -1.6, 2, -1.2];

export function AchievementsScreen() {
  const { token } = useAuth();
  const { status, data: achievements, error, retry } = useApiState<Achievement[]>(
    () => apiRequest<Achievement[]>("/achievements/me", { token: token! }),
    (list) => list.length === 0,
    [token]
  );

  const unlockedCount = achievements?.filter((a) => a.unlocked).length ?? 0;

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="pagina de carimbos"
        title="Suas conquistas"
        subtitle={
          status === "ready" ? `${unlockedCount} de ${achievements!.length} carimbadas no seu caderno` : undefined
        }
      />

      {status === "ready" ? (
        <section className="achievements-list">
          {achievements!.map((achievement, index) => {
            const rarity = getRarity(achievement);
            return (
              <div className="rise-in" style={{ animationDelay: `${index * 80}ms` }} key={achievement.id}>
                <JournalCard
                  tilt={TILTS[index % TILTS.length]}
                  tornEdge="both"
                  className={`achievement-card ${achievement.unlocked ? "" : "achievement-card--locked"}`}
                >
                  <InkStamp
                    variant={achievement.unlocked ? rarity : "locked"}
                    size={64}
                    rotate={index % 2 === 0 ? -10 : 8}
                    label={achievement.unlocked ? "carimbado" : "por vir"}
                  >
                    <MedalIcon size={24} />
                  </InkStamp>
                  <div className="achievement-card__body">
                    <strong>{achievement.name}</strong>
                    {achievement.unlocked ? (
                      <span className={`achievement-card__rarity achievement-card__rarity--${rarity}`}>
                        {RARITY_LABEL[rarity]}
                      </span>
                    ) : null}
                    <p>{achievement.description}</p>
                    {achievement.unlocked && achievement.unlockedAt ? (
                      <span className="achievement-card__date">
                        carimbado em {new Date(achievement.unlockedAt).toLocaleDateString("pt-BR")}
                      </span>
                    ) : null}
                  </div>
                  <span className="achievement-card__points">+{achievement.points}</span>
                </JournalCard>
              </div>
            );
          })}
        </section>
      ) : (
        <PageState
          status={status}
          errorMessage={error ?? undefined}
          emptyMessage="nenhuma conquista cadastrada ainda."
          onRetry={retry}
        />
      )}
    </AppShell>
  );
}
