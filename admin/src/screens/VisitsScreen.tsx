import { useAuth } from "../lib/auth-context";
import { apiRequest } from "../lib/api";
import { useApiState } from "../lib/useApiState";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { ReportCard } from "../components/ui/ReportCard";
import type { Visit } from "../types";
import "./VisitsScreen.css";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VisitsScreen() {
  const { token } = useAuth();

  const { status, data, error, retry } = useApiState<Visit[]>(
    () => apiRequest<Visit[]>("/visits?pageSize=100", { token }),
    (list) => list.length === 0,
    [token]
  );

  return (
    <div>
      <PageHeader
        eyebrow="registro"
        title="Visitas"
        subtitle="As 100 visitas mais recentes registradas nos atrativos da sua organizacao."
      />

      <PageState
        status={status}
        error={error}
        retry={retry}
        emptyTitle="Nenhuma visita registrada ainda"
        emptyHint="Assim que turistas escanearem o QR Code dos seus atrativos, elas aparecem aqui."
      >
        <ReportCard pin="blue" className="visits-table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>turista</th>
                <th>atrativo</th>
                <th>distancia</th>
                <th>data</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((visit) => (
                <tr key={visit.id}>
                  <td>{visit.touristName}</td>
                  <td>{visit.attractionName}</td>
                  <td>{visit.distanceMeters}m</td>
                  <td>{formatDateTime(visit.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportCard>
      </PageState>
    </div>
  );
}
