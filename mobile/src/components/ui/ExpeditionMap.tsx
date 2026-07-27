import { createProjection, seededJitter, type GeoPoint } from "../../lib/map-projection";
import "./ExpeditionMap.css";

export interface MapAttraction extends GeoPoint {
  id: string;
  name: string;
  /** Ordem cronologica da visita (1 = primeira). Undefined = ainda nao visitado. */
  visitOrder?: number;
}

interface ExpeditionMapProps {
  attractions: MapAttraction[];
  width?: number;
  height?: number;
  onSelectAttraction?: (id: string) => void;
}

function buildTrailPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const jitter = (seededJitter(i * 7.13) - 0.5) * 18;
    d += ` Q ${mx + nx * jitter} ${my + ny * jitter} ${b.x} ${b.y}`;
  }
  return d;
}

export function ExpeditionMap({ attractions, width = 320, height = 240, onSelectAttraction }: ExpeditionMapProps) {
  const project = createProjection(attractions, width, height);
  const positioned = attractions.map((a) => ({ ...a, ...project(a) }));
  const visitedOrdered = positioned
    .filter((a) => a.visitOrder !== undefined)
    .sort((a, b) => (a.visitOrder ?? 0) - (b.visitOrder ?? 0));
  const trailPath = buildTrailPath(visitedOrdered);

  return (
    <svg
      className="expedition-map"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label="Mapa dos atrativos e da sua trilha de visitas"
    >
      <rect width={width} height={height} rx={16} className="expedition-map__bg" />

      {[0.18, 0.34, 0.52, 0.7].map((r, i) => (
        <circle
          key={i}
          cx={width * 0.22}
          cy={height * 0.28}
          r={Math.max(width, height) * r}
          className="expedition-map__contour"
        />
      ))}

      {trailPath ? <path d={trailPath} className="expedition-map__trail" /> : null}

      {positioned.map((a) => {
        const visited = a.visitOrder !== undefined;
        return (
          <g
            key={a.id}
            transform={`translate(${a.x}, ${a.y})`}
            className={`expedition-map__pin ${visited ? "expedition-map__pin--visited" : ""}`}
            onClick={() => onSelectAttraction?.(a.id)}
          >
            {visited ? (
              <>
                <circle r={9} className="expedition-map__pin-fill" />
                <circle r={9} className="expedition-map__pin-ring" />
                <text y={3.5} textAnchor="middle" className="expedition-map__pin-number">
                  {a.visitOrder}
                </text>
              </>
            ) : (
              <circle r={7} className="expedition-map__pin-outline" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
