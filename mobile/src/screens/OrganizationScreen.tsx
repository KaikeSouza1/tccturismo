import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import type { Attraction } from "../types";
import { AppShell } from "../components/layout/AppShell";
import { JournalCard } from "../components/ui/JournalCard";
import { Polaroid } from "../components/ui/Polaroid";
import { WashiTape } from "../components/ui/WashiTape";
import { AttractionArt } from "../components/ui/AttractionArt";
import { ChevronLeftIcon, PinIcon } from "../icons";
import "./OrganizationScreen.css";

const CATEGORY_LABEL: Record<string, string> = {
  cultural: "cultural",
  historico: "historico",
  natureza: "natureza",
  lazer: "lazer",
};

const TILTS = [-1.6, 1.3, -1.1, 1.5, -1.3, 1.1];

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
        <WashiTape color="blue" rotate={-4} width={110} top={-10} left={-6} />
        <span className="org-header__pin">
          <PinIcon size={16} />
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
          {attractions.map((attraction, index) => (
            <JournalCard
              key={attraction.id}
              tornEdge="none"
              className="org-list-card rise-in"
              style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/attractions/${attraction.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/attractions/${attraction.id}`);
              }}
            >
              <Polaroid size={76} tilt={TILTS[index % TILTS.length]}>
                <AttractionArt attraction={attraction} size={76} />
              </Polaroid>
              <div className="org-list-card__text">
                <strong>{attraction.name}</strong>
                {attraction.description ? <p>{attraction.description}</p> : null}
                <span className="org-list-card__category">
                  {CATEGORY_LABEL[attraction.category ?? ""] ?? "atrativo"}
                </span>
              </div>
            </JournalCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
