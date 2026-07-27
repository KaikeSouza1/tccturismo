import "./LogStat.css";

interface LogStatProps {
  value: string | number;
  label: string;
  tilt?: number;
}

/**
 * Substitui o "stat card com icone em circulo" generico de dashboard por uma
 * entrada de livro de bordo: o numero vira um carimbo, a legenda e escrita a
 * mao — a mesma metafora do caderno do turista, do lado do gestor.
 */
export function LogStat({ value, label, tilt = 0 }: LogStatProps) {
  return (
    <div className="log-stat" style={{ transform: `rotate(${tilt}deg)` }}>
      <div className="log-stat__ring">
        <span className="log-stat__value">{value}</span>
      </div>
      <span className="log-stat__label">{label}</span>
    </div>
  );
}
