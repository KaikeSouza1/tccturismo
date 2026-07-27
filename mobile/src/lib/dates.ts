export function formatVisitDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}
