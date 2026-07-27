import { useState } from "react";
import { Plus, Landmark, Mail } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import { useApiState } from "../lib/useApiState";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { ReportCard } from "../components/ui/ReportCard";
import { OrganizationFormModal } from "../components/organizations/OrganizationFormModal";
import type { Organization } from "../types";
import "./OrganizationsScreen.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function OrganizationsScreen() {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { status, data, error, retry } = useApiState<Organization[]>(
    () => apiRequest<Organization[]>("/organizations", { token }),
    (list) => list.length === 0,
    [token]
  );

  return (
    <div>
      <PageHeader
        eyebrow="registro geral da plataforma"
        title="Organizacoes"
        subtitle="Cada organizacao (prefeitura, associacao de turismo) gerencia seus proprios atrativos e conquistas."
        action={
          <button className="btn btn--primary" type="button" onClick={() => setShowForm(true)}>
            <Plus size={16} /> nova organizacao
          </button>
        }
      />

      <PageState
        status={status}
        error={error}
        retry={retry}
        emptyTitle="Nenhuma organizacao cadastrada"
        emptyHint="Crie a primeira organizacao para comecar a usar a plataforma."
      >
        <div className="organizations-grid">
          {data?.map((org, index) => (
            <ReportCard key={org.id} pin={index % 2 === 0 ? "blue" : "kraft"} className="organization-card">
              <span className="organization-card__slug">/{org.slug}</span>
              <h3>{org.name}</h3>
              <div className="organization-card__row">
                <Mail size={14} />
                <span>{org.adminEmail ?? "sem admin cadastrado"}</span>
              </div>
              <div className="organization-card__row">
                <Landmark size={14} />
                <span>{org.attractionsCount} atrativo(s) cadastrado(s)</span>
              </div>
              <span className="organization-card__date">desde {formatDate(org.createdAt)}</span>
            </ReportCard>
          ))}
        </div>
      </PageState>

      {showForm ? (
        <OrganizationFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            retry();
          }}
        />
      ) : null}
    </div>
  );
}
