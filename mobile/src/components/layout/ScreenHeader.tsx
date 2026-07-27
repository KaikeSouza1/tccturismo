import type { ReactNode } from "react";
import "./ScreenHeader.css";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function ScreenHeader({ eyebrow, title, subtitle, action }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className="screen-header__row">
        <div className="screen-header__text">
          {eyebrow ? <span className="screen-header__eyebrow">{eyebrow}</span> : null}
          <h1 className="screen-header__title">{title}</h1>
          {subtitle ? <p className="screen-header__subtitle">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="screen-header__rule" />
    </header>
  );
}
