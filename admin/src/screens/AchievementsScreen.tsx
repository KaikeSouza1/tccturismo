import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { apiRequest, ApiError } from "../lib/api";
import { useApiState } from "../lib/useApiState";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { ReportCard } from "../components/ui/ReportCard";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { AchievementIcon } from "../components/ui/AchievementIcon";
import { AchievementFormModal } from "../components/achievements/AchievementFormModal";
import { MAX_ACHIEVEMENTS_PER_ORGANIZATION } from "../lib/achievement-icons";
import type { Achievement, Attraction } from "../types";
import "./AchievementsScreen.css";

const CRITERIA_SUMMARY: Record<string, (v: Record<string, unknown>) => string> = {
  attractions_visited_count: (v) => `visitar ${v.count ?? "?"} atrativos`,
  specific_attractions: (v) => `visitar ${((v.attractionIds as string[]) ?? []).length} atrativos especificos`,
  all_attractions: () => "visitar todos os atrativos da organizacao",
  category_complete: (v) => `visitar todos os atrativos da categoria "${v.category ?? "?"}"`,
  points_total: (v) => `acumular ${v.points ?? "?"} pontos`,
  distinct_categories_count: (v) => `visitar atrativos de ${v.count ?? "?"} categorias diferentes`,
  distinct_organizations_count: (v) => `visitar atrativos de ${v.count ?? "?"} organizacoes diferentes`,
};

function AchievementCard({
  achievement,
  onEdit,
  onDelete,
}: {
  achievement: Achievement;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const summarize = CRITERIA_SUMMARY[achievement.criteriaType];
  return (
    <ReportCard pin={onEdit ? "kraft" : "blue"} className="achievement-card">
      <div className="achievement-card__icon">
        <AchievementIcon name={achievement.icon} size={20} />
      </div>
      <div className="achievement-card__body">
        <h3>{achievement.name}</h3>
        <p>{achievement.description}</p>
        <span className="achievement-card__criteria">
          {summarize ? summarize(achievement.criteriaValue) : ""}
        </span>
      </div>
      <div className="achievement-card__footer">
        <span className="badge badge--amber">+{achievement.points} pts</span>
        {onEdit ? (
          <div className="achievement-card__actions">
            <button className="btn btn--ghost btn--sm" type="button" onClick={onEdit}>
              editar
            </button>
            <button className="btn btn--danger btn--sm" type="button" onClick={onDelete}>
              excluir
            </button>
          </div>
        ) : null}
      </div>
    </ReportCard>
  );
}

export function AchievementsScreen() {
  const { token, user } = useAuth();
  const isPlatformAdmin = user?.role === "platform_admin";
  const [modalMode, setModalMode] = useState<"closed" | "create" | Achievement>("closed");
  const [deleting, setDeleting] = useState<Achievement | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { status, data, error, retry } = useApiState<{
    achievements: Achievement[];
    attractions: Attraction[];
  }>(
    async () => {
      const [achievements, attractions] = await Promise.all([
        apiRequest<Achievement[]>("/achievements/organization", { token }),
        isPlatformAdmin
          ? Promise.resolve([])
          : apiRequest<Attraction[]>("/attractions?includeInactive=true", { token }),
      ]);
      return { achievements, attractions };
    },
    () => false,
    [token, isPlatformAdmin]
  );

  const { fixed, own } = useMemo(() => {
    const achievements = data?.achievements ?? [];
    return {
      fixed: achievements.filter((a) => a.organizationId === null),
      own: achievements.filter((a) => a.organizationId !== null),
    };
  }, [data]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/achievements/${deleting.id}`, { method: "DELETE", token });
      setDeleting(null);
      retry();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Nao foi possivel excluir.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="gamificacao"
        title="Conquistas"
        subtitle={
          isPlatformAdmin
            ? "As 10 conquistas fixas que valem para turistas de qualquer organizacao da plataforma."
            : "10 conquistas fixas valem para todas as organizacoes da plataforma. Alem delas, sua organizacao pode criar ate 10 conquistas proprias."
        }
      />

      <PageState status={status} error={error} retry={retry}>
        <section className="achievements-section">
          <h2 className="achievements-section__title">Conquistas fixas da plataforma</h2>
          <div className="achievements-grid">
            {fixed.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </section>

        {isPlatformAdmin ? null : (
          <section className="achievements-section">
            <div className="achievements-section__header">
              <h2 className="achievements-section__title">
                Conquistas da sua organizacao ({own.length}/{MAX_ACHIEVEMENTS_PER_ORGANIZATION})
              </h2>
              <button
                className="btn btn--primary btn--sm"
                type="button"
                onClick={() => setModalMode("create")}
                disabled={own.length >= MAX_ACHIEVEMENTS_PER_ORGANIZATION}
              >
                <Plus size={15} /> nova conquista
              </button>
            </div>
            {own.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhuma conquista propria ainda</h3>
                <p>Crie desafios exclusivos para os atrativos da sua organizacao.</p>
              </div>
            ) : (
              <div className="achievements-grid">
                {own.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    onEdit={() => setModalMode(achievement)}
                    onDelete={() => setDeleting(achievement)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </PageState>

      {modalMode !== "closed" ? (
        <AchievementFormModal
          achievement={modalMode === "create" ? null : modalMode}
          organizationAttractions={data?.attractions ?? []}
          onClose={() => setModalMode("closed")}
          onSaved={() => {
            setModalMode("closed");
            retry();
          }}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Excluir conquista"
          message={`Tem certeza que deseja excluir "${deleting.name}"? Turistas que ja desbloquearam perderao o registro.`}
          confirmLabel="Excluir"
          danger
          busy={deleteBusy}
          onCancel={() => {
            setDeleting(null);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
        />
      ) : null}
      {deleteError ? <p className="banner banner--error">{deleteError}</p> : null}
    </div>
  );
}
