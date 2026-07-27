import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { IconPicker } from "../ui/IconPicker";
import { AchievementIcon } from "../ui/AchievementIcon";
import { apiRequest, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { CATEGORY_LABEL, type Achievement, type Attraction } from "../../types";

const CRITERIA_LABEL: Record<string, string> = {
  attractions_visited_count: "numero de atrativos visitados",
  specific_attractions: "atrativos especificos",
  all_attractions: "todos os atrativos da organizacao",
  category_complete: "todos os atrativos de uma categoria",
};

interface AchievementFormModalProps {
  achievement: Achievement | null;
  organizationAttractions: Attraction[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  description: string;
  icon: string;
  points: number;
  criteriaType: keyof typeof CRITERIA_LABEL;
  count: number;
  category: string;
  attractionIds: string[];
}

function toFormState(achievement: Achievement | null): FormState {
  const value = achievement?.criteriaValue ?? {};
  return {
    name: achievement?.name ?? "",
    description: achievement?.description ?? "",
    icon: achievement?.icon ?? "Trophy",
    points: achievement?.points ?? 20,
    criteriaType:
      (achievement?.criteriaType as keyof typeof CRITERIA_LABEL) ?? "attractions_visited_count",
    count: Number(value.count ?? 3),
    category: String(value.category ?? "cultural"),
    attractionIds: Array.isArray(value.attractionIds) ? (value.attractionIds as string[]) : [],
  };
}

export function AchievementFormModal({
  achievement,
  organizationAttractions,
  onClose,
  onSaved,
}: AchievementFormModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState<FormState>(() => toFormState(achievement));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(toFormState(achievement)), [achievement]);

  function criteriaValue(): Record<string, unknown> {
    switch (form.criteriaType) {
      case "attractions_visited_count":
        return { count: form.count };
      case "category_complete":
        return { category: form.category };
      case "specific_attractions":
        return { attractionIds: form.attractionIds };
      case "all_attractions":
      default:
        return {};
    }
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        icon: form.icon,
        points: form.points,
        criteriaType: form.criteriaType,
        criteriaValue: criteriaValue(),
      };
      if (achievement) {
        await apiRequest(`/achievements/${achievement.id}`, { method: "PUT", token, body: payload });
      } else {
        await apiRequest("/achievements", { method: "POST", token, body: payload });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar a conquista.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={achievement ? "Editar conquista" : "Nova conquista"} onClose={onClose} width={620}>
      <div className="form-grid">
        <div className="field form-grid--full">
          <label>nome</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Roteiro Completo"
          />
        </div>

        <div className="field form-grid--full">
          <label>descricao</label>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="field">
          <label>pontos</label>
          <input
            className="input"
            type="number"
            min={0}
            max={1000}
            value={form.points}
            onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
          />
        </div>

        <div className="field">
          <label>criterio</label>
          <select
            className="select"
            value={form.criteriaType}
            onChange={(e) =>
              setForm((f) => ({ ...f, criteriaType: e.target.value as FormState["criteriaType"] }))
            }
          >
            {Object.entries(CRITERIA_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {form.criteriaType === "attractions_visited_count" ? (
          <div className="field form-grid--full">
            <label>quantidade de atrativos (dentre os da sua organizacao)</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.count}
              onChange={(e) => setForm((f) => ({ ...f, count: Number(e.target.value) }))}
            />
          </div>
        ) : null}

        {form.criteriaType === "category_complete" ? (
          <div className="field form-grid--full">
            <label>categoria</label>
            <select
              className="select"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {form.criteriaType === "specific_attractions" ? (
          <div className="field form-grid--full">
            <label>atrativos exigidos</label>
            <div className="achievement-attraction-list">
              {organizationAttractions.map((attraction) => (
                <label key={attraction.id} className="achievement-attraction-list__item">
                  <input
                    type="checkbox"
                    checked={form.attractionIds.includes(attraction.id)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        attractionIds: e.target.checked
                          ? [...f.attractionIds, attraction.id]
                          : f.attractionIds.filter((id) => id !== attraction.id),
                      }))
                    }
                  />
                  {attraction.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="field form-grid--full">
          <label>icone ({form.icon})</label>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div className="achievement-icon-preview">
              <AchievementIcon name={form.icon} size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <IconPicker value={form.icon} onChange={(icon) => setForm((f) => ({ ...f, icon }))} />
            </div>
          </div>
        </div>
      </div>

      {error ? <p className="banner banner--error" style={{ marginTop: 16 }}>{error}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button className="btn btn--ghost" onClick={onClose} type="button" disabled={saving}>
          Cancelar
        </button>
        <button className="btn btn--primary" onClick={handleSubmit} type="button" disabled={saving || !form.name.trim()}>
          {saving ? "salvando..." : achievement ? "Salvar alteracoes" : "Criar conquista"}
        </button>
      </div>
    </Modal>
  );
}
