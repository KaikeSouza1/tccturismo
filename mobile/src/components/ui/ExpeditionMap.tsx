import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./ExpeditionMap.css";

export interface MapAttraction {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Ordem cronologica da visita (1 = primeira). Undefined = ainda nao visitado. */
  visitOrder?: number;
}

interface ExpeditionMapProps {
  attractions: MapAttraction[];
  height?: number;
  onSelectAttraction?: (id: string) => void;
}

function pinIcon(visited: boolean, visitOrder?: number) {
  const html = visited
    ? `<div class="expedition-map__pin expedition-map__pin--visited">${visitOrder}</div>`
    : `<div class="expedition-map__pin expedition-map__pin--outline"></div>`;
  return L.divIcon({ html, className: "expedition-map__icon", iconSize: [22, 22], iconAnchor: [11, 11] });
}

function FitBounds({ attractions }: { attractions: MapAttraction[] }) {
  const map = useMap();
  useEffect(() => {
    if (attractions.length === 0) return;
    const bounds = L.latLngBounds(attractions.map((a) => [a.latitude, a.longitude]));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attractions.length]);
  return null;
}

export function ExpeditionMap({ attractions, height = 240, onSelectAttraction }: ExpeditionMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const visitedOrdered = useMemo(
    () =>
      attractions
        .filter((a) => a.visitOrder !== undefined)
        .sort((a, b) => (a.visitOrder ?? 0) - (b.visitOrder ?? 0))
        .map((a) => [a.latitude, a.longitude] as [number, number]),
    [attractions]
  );
  const center = useMemo<[number, number]>(() => {
    if (attractions.length === 0) return [0, 0];
    return [attractions[0].latitude, attractions[0].longitude];
  }, [attractions]);

  return (
    <div className="expedition-map" style={{ width: "100%", height }}>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", borderRadius: 16 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {visitedOrdered.length > 1 ? (
          <Polyline positions={visitedOrdered} pathOptions={{ color: "#279A62", weight: 3, dashArray: "1 8", lineCap: "round" }} />
        ) : null}
        {attractions.map((a) => (
          <Marker
            key={a.id}
            position={[a.latitude, a.longitude]}
            icon={pinIcon(a.visitOrder !== undefined, a.visitOrder)}
            eventHandlers={{ click: () => onSelectAttraction?.(a.id) }}
          />
        ))}
        <FitBounds attractions={attractions} />
      </MapContainer>
    </div>
  );
}
