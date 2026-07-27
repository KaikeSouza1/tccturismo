import { useEffect, useRef, useState } from "react";
import { Download, Images, Info, MapPin, Plus, RefreshCw, Stamp, Star, X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { ReportCard } from "../ui/ReportCard";
import { MapPicker } from "../ui/MapPicker";
import { apiRequest, apiUpload, galleryImageUrl, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { CATEGORY_LABEL, type Attraction } from "../../types";

const MAX_IMAGES = 6;
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

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

interface GalleryImage {
  id: string;
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

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  useEffect(() => {
    setForm(toFormState(attraction));
  }, [attraction]);

  useEffect(() => {
    if (!attraction) {
      setImages([]);
      return;
    }
    apiRequest<GalleryImage[]>(`/attractions/${attraction.id}/images`)
      .then(setImages)
      .catch(() => setImages([]));
  }, [attraction]);

  async function loadQrPreview() {
    if (!attraction) return;
    setLoadingQr(true);
    try {
      const response = await fetch(`${API_URL}/attractions/${attraction.id}/qrcode`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      setQrPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } finally {
      setLoadingQr(false);
    }
  }

  useEffect(() => {
    loadQrPreview();
    return () => {
      setQrPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attraction?.id]);

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

  async function handleAddImage(file: File) {
    if (!attraction) return;
    setUploadingImage(true);
    setError(null);
    try {
      const created = await apiUpload<{ id: string }>(
        `/attractions/${attraction.id}/images`,
        file,
        token
      );
      setImages((prev) => [...prev, { id: created.id }]);
      onImageChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel enviar a imagem.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!attraction) return;
    try {
      await apiRequest(`/attractions/${attraction.id}/images/${imageId}`, {
        method: "DELETE",
        token,
      });
      setImages((prev) => prev.filter((i) => i.id !== imageId));
      onImageChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel remover a imagem.");
    }
  }

  async function handleSetCover(imageId: string) {
    if (!attraction) return;
    try {
      await apiRequest(`/attractions/${attraction.id}/images/${imageId}/cover`, {
        method: "PUT",
        token,
      });
      setImages((prev) => {
        const target = prev.find((i) => i.id === imageId);
        if (!target) return prev;
        return [target, ...prev.filter((i) => i.id !== imageId)];
      });
      onImageChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel definir a capa.");
    }
  }

  async function handleDownloadQr() {
    if (!attraction || !qrPreviewUrl) return;
    const a = document.createElement("a");
    a.href = qrPreviewUrl;
    a.download = `qrcode-${attraction.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }

  async function handleRegenerateQr() {
    if (!attraction) return;
    setConfirmRegenerate(false);
    setLoadingQr(true);
    try {
      await apiRequest(`/attractions/${attraction.id}/qrcode/regenerate`, {
        method: "POST",
        token,
      });
      await loadQrPreview();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel gerar um novo QR Code.");
      setLoadingQr(false);
    }
  }

  return (
    <Modal title={attraction ? "Editar atrativo" : "Novo atrativo"} onClose={onClose} width={640}>
      <div className="form-section-title">
        <Info size={15} />
        <span>informacoes</span>
      </div>
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

        <div className="form-section-title form-grid--full">
          <MapPin size={15} />
          <span>localizacao</span>
        </div>
        <div className="field form-grid--full">
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
          <div className="form-grid--full">
            <ReportCard pin="blue" className="attraction-photos-card">
              <h4 className="attraction-photos-card__title">
                <Images size={15} /> fotos do atrativo
              </h4>
              <p className="field__hint">
                ate {MAX_IMAGES} fotos — a marcada com a estrela e a capa usada na lista do turista. passe o
                mouse sobre uma foto para definir como capa ou remover.
              </p>
              <div className="attraction-gallery">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`attraction-gallery__item${index === 0 ? " attraction-gallery__item--cover" : ""}`}
                  >
                    <img src={galleryImageUrl(attraction.id, image.id)} alt="" />
                    {index === 0 ? <span className="attraction-gallery__cover-badge">capa</span> : null}
                    <div className="attraction-gallery__item-actions">
                      {index !== 0 ? (
                        <button type="button" title="definir como capa" onClick={() => handleSetCover(image.id)}>
                          <Star size={12} />
                        </button>
                      ) : null}
                      <button type="button" title="remover" onClick={() => handleDeleteImage(image.id)}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {images.length < MAX_IMAGES ? (
                  <button
                    type="button"
                    className="attraction-gallery__add"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <span>enviando...</span>
                    ) : (
                      <>
                        <Plus size={20} />
                        <span>{images.length === 0 ? "enviar foto" : "adicionar"}</span>
                      </>
                    )}
                  </button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddImage(file);
                  e.target.value = "";
                }}
              />
            </ReportCard>
          </div>
        ) : null}

        {attraction ? (
          <div className="form-grid--full">
            <ReportCard pin="kraft" className="attraction-seal-card">
              <h4 className="attraction-seal-card__title">
                <Stamp size={15} /> selo de carimbo do local
              </h4>
              <p className="field__hint">
                o turista aponta a camera para este codigo no local para carimbar a visita. regerar o codigo
                invalida qualquer QR ja impresso — sera preciso imprimir e trocar a placa no local.
              </p>
              <div className="attraction-qr">
                <div className="attraction-qr__preview">
                  {qrPreviewUrl ? <img src={qrPreviewUrl} alt="QR Code do atrativo" /> : null}
                </div>
                <div className="attraction-qr__actions">
                  <button
                    className="btn btn--ghost btn--sm"
                    type="button"
                    onClick={handleDownloadQr}
                    disabled={loadingQr || !qrPreviewUrl}
                  >
                    <Download size={14} /> baixar PNG
                  </button>
                  {confirmRegenerate ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn--danger btn--sm"
                        type="button"
                        onClick={handleRegenerateQr}
                      >
                        confirmar
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        type="button"
                        onClick={() => setConfirmRegenerate(false)}
                      >
                        cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn--ghost btn--sm"
                      type="button"
                      onClick={() => setConfirmRegenerate(true)}
                      disabled={loadingQr}
                    >
                      <RefreshCw size={14} /> regenerar codigo
                    </button>
                  )}
                </div>
              </div>
            </ReportCard>
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
