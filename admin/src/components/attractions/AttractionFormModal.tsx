import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { MapPicker } from "../ui/MapPicker";
import { apiRequest, apiUpload, imageUrl, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { CATEGORY_LABEL, type Attraction } from "../../types";

interface AttractionFormModalProps {
  attraction: Attraction | null;
  onClose: () => void;
  onSaved: (attraction: Attraction, opts?: { keepEditing?: boolean }) => void;
  onImageChanged?: () => void;
}

interface FormState {
  name: string;
  description: string;
  category: string;
  radiusMeters: number;
  latitude: number;
  longitude: number;
  active: boolean;
}

const DEFAULT_CENTER = { latitude: -26.2296, longitude: -51.0881 };

function toFormState(attraction: Attraction | null): FormState {
  if (!attraction) {
    return {
      name: "",
      description: "",
      category: "cultural",
      radiusMeters: 60,
      latitude: DEFAULT_CENTER.latitude,
      longitude: DEFAULT_CENTER.longitude,
      active: true,
    };
  }
  return {
    name: attraction.name,
    description: attraction.description ?? "",
    category: attraction.category ?? "cultural",
    radiusMeters: attraction.radiusMeters,
    latitude: attraction.latitude,
    longitude: attraction.longitude,
    active: attraction.active,
  };
}

export function AttractionFormModal({
  attraction,
  onClose,
  onSaved,
  onImageChanged,
}: AttractionFormModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState<FormState>(() => toFormState(attraction));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hasImage, setHasImage] = useState(attraction?.hasImage ?? false);
  const [qrObjectUrl, setQrObjectUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(toFormState(attraction));
    setHasImage(attraction?.hasImage ?? false);
  }, [attraction]);

  useEffect(() => {
    return () => {
      if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl);
    };
  }, [qrObjectUrl]);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        radiusMeters: form.radiusMeters,
        latitude: form.latitude,
        longitude: form.longitude,
        ...(attraction ? { active: form.active } : {}),
      };

      const saved = attraction
        ? await apiRequest<Attraction>(`/attractions/${attraction.id}`, {
            method: "PUT",
            token,
            body: payload,
          })
        : await apiRequest<Attraction>("/attractions", { method: "POST", token, body: payload });

      onSaved(saved, { keepEditing: !attraction });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o atrativo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageChange(file: File) {
    if (!attraction) return;
    setUploadingImage(true);
    setError(null);
    try {
      await apiUpload(`/attractions/${attraction.id}/image`, file, token);
      setHasImage(true);
      onImageChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel enviar a imagem.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage() {
    if (!attraction) return;
    setUploadingImage(true);
    try {
      await apiRequest(`/attractions/${attraction.id}/image`, { method: "DELETE", token });
      setHasImage(false);
      onImageChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel remover a imagem.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDownloadQr() {
    if (!attraction) return;
    const response = await fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:3333/api"}/attractions/${attraction.id}/qrcode`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setQrObjectUrl(url);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${attraction.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }

  return (
    <Modal title={attraction ? "Editar atrativo" : "Novo atrativo"} onClose={onClose} width={640}>
      <div className="form-grid">
        <div className="field form-grid--full">
          <label>nome</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Praca Coronel Amazonas"
          />
        </div>

        <div className="field form-grid--full">
          <label>descricao</label>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Um breve resumo para o turista"
          />
        </div>

        <div className="field">
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

        <div className="field">
          <label>raio de deteccao (metros)</label>
          <input
            className="input"
            type="number"
            min={10}
            max={2000}
            value={form.radiusMeters}
            onChange={(e) => setForm((f) => ({ ...f, radiusMeters: Number(e.target.value) }))}
          />
        </div>

        {attraction ? (
          <div className="field">
            <label>status</label>
            <select
              className="select"
              value={form.active ? "active" : "inactive"}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "active" }))}
            >
              <option value="active">ativo</option>
              <option value="inactive">inativo</option>
            </select>
          </div>
        ) : null}

        <div className="field form-grid--full">
          <label>localizacao no mapa</label>
          <span className="field__hint">
            clique no mapa ou arraste o marcador para ajustar — o circulo azul mostra o raio de deteccao
            usado para validar que o turista estava no local na hora de carimbar
          </span>
          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            radiusMeters={form.radiusMeters}
            onChange={(latitude, longitude) => setForm((f) => ({ ...f, latitude, longitude }))}
          />
        </div>

        {attraction ? (
          <div className="field form-grid--full">
            <label>foto do atrativo</label>
            <div className="attraction-image-uploader">
              {hasImage ? (
                <img src={`${imageUrl(attraction.id)}?t=${Date.now()}`} alt={attraction.name} />
              ) : (
                <div className="attraction-image-uploader__placeholder">
                  <ImagePlus size={22} />
                  <span>nenhuma foto enviada</span>
                </div>
              )}
              <div className="attraction-image-uploader__actions">
                <button
                  className="btn btn--ghost btn--sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? "enviando..." : hasImage ? "trocar foto" : "enviar foto"}
                </button>
                {hasImage ? (
                  <button
                    className="btn btn--danger btn--sm"
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                  >
                    <Trash2 size={14} /> remover
                  </button>
                ) : null}
                <button className="btn btn--ghost btn--sm" type="button" onClick={handleDownloadQr}>
                  <Download size={14} /> baixar QR Code
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageChange(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="banner banner--error" style={{ marginTop: 16 }}>{error}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button className="btn btn--ghost" onClick={onClose} type="button" disabled={saving}>
          Cancelar
        </button>
        <button className="btn btn--primary" onClick={handleSubmit} type="button" disabled={saving || !form.name.trim()}>
          {saving ? "salvando..." : attraction ? "Salvar alteracoes" : "Criar atrativo"}
        </button>
      </div>
    </Modal>
  );
}
