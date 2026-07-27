import { useMemo } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import { useApiState } from "../lib/useApiState";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { ReportCard } from "../components/ui/ReportCard";
import { LogStat } from "../components/ui/LogStat";
import type {
  DashboardSummary,
  HeatmapPoint,
  VisitsByAttraction,
  VisitsOverTimePoint,
} from "../types";
import "./DashboardScreen.css";

interface DashboardData {
  summary: DashboardSummary;
  visitsByAttraction: VisitsByAttraction[];
  visitsOverTime: VisitsOverTimePoint[];
  heatmap: HeatmapPoint[];
}

function formatChartDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function DashboardScreen() {
  const { token } = useAuth();

  const { status, data, error, retry } = useApiState<DashboardData>(
    async () => {
      const [summary, visitsByAttraction, visitsOverTime, heatmap] = await Promise.all([
        apiRequest<DashboardSummary>("/dashboard/summary", { token }),
        apiRequest<VisitsByAttraction[]>("/dashboard/visits-by-attraction", { token }),
        apiRequest<VisitsOverTimePoint[]>("/dashboard/visits-over-time?days=30", { token }),
        apiRequest<HeatmapPoint[]>("/dashboard/heatmap", { token }),
      ]);
      return { summary, visitsByAttraction, visitsOverTime, heatmap };
    },
    () => false,
    [token]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (!data || data.heatmap.length === 0) return [-26.2296, -51.0881];
    const avgLat = data.heatmap.reduce((sum, p) => sum + p.latitude, 0) / data.heatmap.length;
    const avgLng = data.heatmap.reduce((sum, p) => sum + p.longitude, 0) / data.heatmap.length;
    return [avgLat, avgLng];
  }, [data]);

  const maxWeight = useMemo(
    () => Math.max(1, ...(data?.heatmap.map((p) => p.weight) ?? [1])),
    [data]
  );

  return (
    <div>
      <PageHeader
        eyebrow="folha de registro — ultimos 30 dias"
        title="Painel"
        subtitle="Como anda a visitacao dos atrativos da sua organizacao."
      />

      <PageState status={status} error={error} retry={retry}>
        {data ? (
          <>
            <ReportCard pin="blue" className="dashboard-ledger">
              <LogStat value={data.summary.totalVisits} label="visitas registradas" tilt={-1.5} />
              <span className="dashboard-ledger__divider" />
              <LogStat value={data.summary.totalTourists} label="turistas unicos" tilt={1} />
              <span className="dashboard-ledger__divider" />
              <LogStat value={data.summary.totalAttractions} label="atrativos ativos" tilt={-1} />
              <span className="dashboard-ledger__divider" />
              <LogStat value={data.summary.visitsToday} label="visitas hoje" tilt={1.5} />
            </ReportCard>

            <div className="dashboard-grid">
              <ReportCard pin="kraft" className="dashboard-panel">
                <h3 className="dashboard-panel__title">visitas ao longo do tempo</h3>
                <div className="dashboard-panel__chart">
                  <ResponsiveContainer width="100%" height={230}>
                    <LineChart data={data.visitsOverTime}>
                      <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 4" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        tick={{ fontSize: 12, fill: "var(--color-ink-500)", fontFamily: "var(--font-body)" }}
                        axisLine={{ stroke: "var(--color-line)" }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "var(--color-ink-500)", fontFamily: "var(--font-body)" }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                      />
                      <ChartTooltip
                        labelFormatter={(v) => formatChartDate(String(v))}
                        cursor={{ stroke: "var(--color-blue-300)", strokeDasharray: "3 3" }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--color-line)",
                          fontSize: 13,
                          fontFamily: "var(--font-body)",
                          background: "var(--color-paper-raised)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="visitCount"
                        name="visitas"
                        stroke="var(--color-ink-stamp)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ReportCard>

              <ReportCard pin="blue" className="dashboard-panel">
                <h3 className="dashboard-panel__title">visitas por atrativo</h3>
                <div className="dashboard-panel__chart">
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={data.visitsByAttraction} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 4" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "var(--color-ink-500)", fontFamily: "var(--font-body)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="attractionName"
                        width={140}
                        tick={{ fontSize: 12, fill: "var(--color-ink-700)", fontFamily: "var(--font-body)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip
                        cursor={{ fill: "var(--color-blue-50)" }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--color-line)",
                          fontSize: 13,
                          fontFamily: "var(--font-body)",
                          background: "var(--color-paper-raised)",
                        }}
                      />
                      <Bar dataKey="visitCount" name="visitas" fill="var(--color-blue-600)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ReportCard>
            </div>

            <ReportCard pin="kraft" className="dashboard-map-panel">
              <h3 className="dashboard-panel__title">mapa de visitacao</h3>
              <p className="dashboard-panel__hint">
                o tamanho de cada marcacao representa o volume de visitas do atrativo.
              </p>
              <div className="dashboard-map">
                <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={false} style={{ height: "100%" }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
                  />
                  {data.heatmap.map((point) => (
                    <CircleMarker
                      key={`${point.latitude}-${point.longitude}`}
                      center={[point.latitude, point.longitude]}
                      radius={8 + (point.weight / maxWeight) * 22}
                      pathOptions={{
                        color: "var(--color-ink-stamp)",
                        fillColor: "#2F92DD",
                        fillOpacity: 0.4,
                        weight: 1.5,
                      }}
                    >
                      <Tooltip>
                        {point.attractionName} — {point.weight} visita(s)
                      </Tooltip>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </ReportCard>
          </>
        ) : null}
      </PageState>
    </div>
  );
}
