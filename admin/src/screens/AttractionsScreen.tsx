import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import { useApiState } from "../lib/useApiState";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { ReportCard } from "../components/ui/ReportCard";
import { AttractionFormModal } from "../components/attractions/AttractionFormModal";
import { imageUrl } from "../lib/api";
import { CATEGORY_LABEL, type Attraction } from "../types";
import "./AttractionsScreen.css";

export function AttractionsScreen() {
  const { token } = useAuth();
  const [modalMode, setModalMode] = useState<"closed" | "create" | Attraction>("closed");

  const { status, data, error, retry } = useApiState<Attraction[]>(
    () => apiRequest<Attraction[]>("/attractions?includeInactive=true", { token }),
    (list) => list.length === 0,
    [token]
  );

  async function toggleActive(attraction: Attraction) {
    await apiRequest(`/attractions/${attraction.id}`, {
      method: "PUT",
      token,
      body: { active: !attraction.active },
    });
    retry();
  }

  return (
    <div>
      <PageHeader
        eyebrow="gestao"
        title="Atrativos"
        subtitle="Cadastre pontos turisticos, defina o raio de deteccao por GPS e envie fotos reais."
        action={
          <button className="btn btn--primary" type="button" onClick={() => setModalMode("create")}>
            <Plus size={16} /> novo atrativo
          </button>
        }
      />

      <PageState
        status={status}
        error={error}
        retry={retry}
        emptyTitle="Nenhum atrativo cadastrado"
        emptyHint="Crie o primeiro atrativo da sua organizacao para comecar."
      >
        <div className="attractions-grid">
          {data?.map((attraction, index) => (
            <ReportCard
              key={attraction.id}
              torn={false}
              pin={index % 2 === 0 ? "blue" : "kraft"}
              className="attraction-card"
            >
              <div className="attraction-card__media">
                {attraction.hasImage ? (
                  <img src={imageUrl(attraction.id)} alt={attraction.name} />
                ) : (
                  <div className="attraction-card__media-placeholder">sem foto</div>
                )}
                <span className={`badge attraction-card__status ${attraction.active ? "badge--trail" : "badge--clay"}`}>
                  {attraction.active ? "ativo" : "inativo"}
                </span>
              </div>
              <div className="attraction-card__body">
                <span className="badge badge--blue">
                  {CATEGORY_LABEL[attraction.category ?? ""] ?? "sem categoria"}
                </span>
                <h3>{attraction.name}</h3>
                <p>{attraction.description || "sem descricao"}</p>
                <span className="attraction-card__radius">raio de {attraction.radiusMeters}m</span>
              </div>
              <div className="attraction-card__actions">
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => setModalMode(attraction)}>
                  editar
                </button>
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => toggleActive(attraction)}>
                  {attraction.active ? "desativar" : "ativar"}
                </button>
              </div>
            </ReportCard>
          ))}
        </div>
      </PageState>

      {modalMode !== "closed" ? (
        <AttractionFormModal
          attraction={modalMode === "create" ? null : modalMode}
          onClose={() => setModalMode("closed")}
          onImageChanged={retry}
          onSaved={(saved, opts) => {
            retry();
            if (opts?.keepEditing) {
              setModalMode(saved);
            } else {
              setModalMode("closed");
            }
          }}
        />
      ) : null}
    </div>
  );
}
