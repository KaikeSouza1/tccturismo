import type { HTMLAttributes, ReactNode } from "react";
import "./ReportCard.css";

interface ReportCardProps extends HTMLAttributes<HTMLDivElement> {
  torn?: boolean;
  pin?: "blue" | "kraft" | "none";
  children: ReactNode;
}

/**
 * Cartao base do painel: uma folha de relatorio de campo (borda rasgada no
 * topo + pino/fita de cor), a mesma linguagem visual do caderno do turista,
 * em vez do cartao branco arredondado generico de dashboard.
 */
export function ReportCard({ torn = true, pin = "none", className, children, ...rest }: ReportCardProps) {
  const classes = ["report-card", torn ? "report-card--torn" : "", className].filter(Boolean).join(" ");
  return (
    <div className={classes} {...rest}>
      {pin !== "none" ? <span className={`report-card__pin report-card__pin--${pin}`} /> : null}
      <div className="report-card__surface">{children}</div>
    </div>
  );
}
