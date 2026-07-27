import { useEffect, useRef, useState, type FormEvent } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { Layers, Maximize2, Minimize2, Search } from "lucide-react";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "./MapPicker.css";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    labelsUrl: null,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    // Camada de nomes de ruas/cidades (dados OSM via CARTO) sobreposta a
    // imagem de satelite — sem ela fica so a foto crua, sem nenhuma
    // informacao de localizacao. A referencia da Esri usada antes tem dados
    // esparsos demais para cidades pequenas do Brasil.
    labelsUrl: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
  },
};

interface MapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  onChange: (latitude: number, longitude: number) => void;
}

interface SearchResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView([latitude, longitude]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function MapPicker({ latitude, longitude, radiusMeters, onChange }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [layer, setLayer] = useState<keyof typeof LAYERS>("street");
  const [fullscreen, setFullscreen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchError("Nenhum lugar encontrado para essa busca.");
        return;
      }
      setResults(
        data.map((item: { display_name: string; lat: string; lon: string }) => ({
          displayName: item.display_name,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        }))
      );
    } catch {
      setSearchError("Nao foi possivel buscar agora. Tente novamente.");
    } finally {
      setSearching(false);
    }
  }

  function handleSelectResult(result: SearchResult) {
    onChange(result.latitude, result.longitude);
    mapRef.current?.flyTo([result.latitude, result.longitude], 17, { duration: 0.6 });
    setResults([]);
    setQuery(result.displayName);
  }

  // Leaflet mede o container na primeira renderizacao; ao trocar de tamanho
  // (entrar/sair da tela cheia) e preciso mandar recalcular, senao os
  // ladrilhos ficam cortados/desalinhados no novo tamanho.
  useEffect(() => {
    const timeout = setTimeout(() => mapRef.current?.invalidateSize(), 250);
    return () => clearTimeout(timeout);
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  return (
    <div className="map-picker">
      <form className="map-picker__search" onSubmit={handleSearch}>
        <Search size={15} />
        <input
          className="map-picker__search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="buscar endereco ou lugar..."
        />
        <button className="btn btn--ghost btn--sm" type="submit" disabled={searching}>
          {searching ? "buscando..." : "buscar"}
        </button>
      </form>

      {results.length > 0 ? (
        <ul className="map-picker__results">
          {results.map((result, index) => (
            <li key={index}>
              <button type="button" onClick={() => handleSelectResult(result)}>
                {result.displayName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {searchError ? <p className="map-picker__search-error">{searchError}</p> : null}

      {fullscreen ? <div className="map-picker__scrim" onClick={() => setFullscreen(false)} /> : null}

      <div className={`map-picker__canvas${fullscreen ? " map-picker__canvas--fullscreen" : ""}`}>
        <button
          type="button"
          className="map-picker__layer-toggle"
          onClick={() => setLayer((l) => (l === "street" ? "satellite" : "street"))}
          title={layer === "street" ? "ver satelite" : "ver mapa"}
        >
          <Layers size={14} />
          {layer === "street" ? "satelite" : "mapa"}
        </button>

        <button
          type="button"
          className="map-picker__fullscreen-toggle"
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? "sair da tela cheia" : "ver em tela cheia"}
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {fullscreen ? "fechar" : "tela cheia"}
        </button>

        <MapContainer ref={mapRef} center={[latitude, longitude]} zoom={16} style={{ height: "100%" }}>
          <TileLayer attribution={LAYERS[layer].attribution} url={LAYERS[layer].url} />
          {LAYERS[layer].labelsUrl ? <TileLayer url={LAYERS[layer].labelsUrl} /> : null}
          {radiusMeters ? (
            <Circle
              center={[latitude, longitude]}
              radius={radiusMeters}
              pathOptions={{ color: "#0B5FA5", fillColor: "#2F92DD", fillOpacity: 0.18, weight: 1.5 }}
            />
          ) : null}
          <Marker
            position={[latitude, longitude]}
            icon={defaultIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const pos = marker.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
          <ClickHandler onChange={onChange} />
          <Recenter latitude={latitude} longitude={longitude} />
        </MapContainer>
      </div>
    </div>
  );
}
