import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import type { Attraction } from "../types";
import { AppShell } from "../components/layout/AppShell";
import { Polaroid } from "../components/ui/Polaroid";
import { AttractionArt } from "../components/ui/AttractionArt";
import { ChevronLeftIcon, PinIcon } from "../icons";
import "./OrganizationScreen.css";

const CATEGORY_LABEL: Record<string, string> = {
  cultural: "cultural",
  historico: "historico",
  natureza: "natureza",
  lazer: "lazer",
};

export function OrganizationScreen() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const list = await apiRequest<Attraction[]>("/attractions", { token });
      setAttractions(list.filter((a) => a.organizationId === organizationId));
      setLoading(false);
    })();
  }, [token, organizationId]);

  const organizationName = attractions[0]?.organizationName ?? "atrativos";

  return (
    <AppShell>
      <div className="detail-topbar">
        <button className="detail-topbar__back" onClick={() => navigate(-1)}>
          <ChevronLeftIcon size={20} />
          <span>voltar</span>
        </button>
      </div>

      <header className="org-header">
        <span className="org-header__pin">
          <PinIcon size={14} />
        </span>
        <h1 className="org-header__title">{organizationName}</h1>
        {!loading ? (
          <span className="org-header__count">
            {attractions.length} {attractions.length === 1 ? "atrativo" : "atrativos"}
          </span>
        ) : null}
      </header>

      {loading ? (
        <p className="home-empty">carregando atrativos...</p>
      ) : attractions.length === 0 ? (
        <p className="home-empty">nenhum atrativo encontrado para esta organizacao.</p>
      ) : (
        <div className="org-list">
          {attractions.map((attraction) => (
            <article
              className="org-list-card"
              role="button"
              tabIndex={0}
              key={attraction.id}
              onClick={() => navigate(`/attractions/${attraction.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/attractions/${attraction.id}`);
              }}
            >
              <Polaroid size={84} tilt={0}>
                <AttractionArt attraction={attraction} size={84} />
              </Polaroid>
              <div className="org-list-card__text">
                <strong>{attraction.name}</strong>
                {attraction.description ? <p>{attraction.description}</p> : null}
                <span className="org-list-card__category">
                  {CATEGORY_LABEL[attraction.category ?? ""] ?? "atrativo"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
