import { useState } from "react";
import { Modal } from "../ui/Modal";
import { apiRequest, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import type { Organization } from "../../types";

interface OrganizationFormModalProps {
  onClose: () => void;
  onSaved: (organization: Organization) => void;
}

export function OrganizationFormModal({ onClose, onSaved }: OrganizationFormModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const organization = await apiRequest<Organization>("/organizations", {
        method: "POST",
        token,
        body: { name: name.trim(), adminName: adminName.trim(), adminEmail: adminEmail.trim(), adminPassword },
      });
      onSaved(organization);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel criar a organizacao.");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = name.trim() && adminName.trim() && adminEmail.trim() && adminPassword.length >= 6;

  return (
    <Modal title="Nova organizacao" onClose={onClose} width={520}>
      <p className="organization-form__intro">
        Cria a organizacao e ja a primeira conta admin dela, pronta para entrar no painel.
      </p>

      <div className="field" style={{ marginBottom: 14 }}>
        <label>nome da organizacao</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Prefeitura de Porto Uniao"
        />
      </div>

      <div className="organization-form__divider">primeira conta admin</div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label>nome do admin</label>
        <input
          className="input"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          placeholder="Nome completo"
        />
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <label>e-mail do admin</label>
        <input
          className="input"
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          placeholder="admin@organizacao.com.br"
        />
      </div>
      <div className="field">
        <label>senha do admin</label>
        <input
          className="input"
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="minimo 6 caracteres"
        />
      </div>

      {error ? <p className="banner banner--error" style={{ marginTop: 16 }}>{error}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button className="btn btn--ghost" onClick={onClose} type="button" disabled={saving}>
          Cancelar
        </button>
        <button className="btn btn--primary" onClick={handleSubmit} type="button" disabled={saving || !canSubmit}>
          {saving ? "criando..." : "Criar organizacao"}
        </button>
      </div>
    </Modal>
  );
}
