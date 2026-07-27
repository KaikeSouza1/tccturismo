import { NavLink } from "react-router-dom";
import { CompassIcon, MedalIcon, ScanIcon, TrophyIcon, UserIcon } from "../../icons";
import "./BottomNav.css";

function navClass({ isActive }: { isActive: boolean }) {
  return `bottom-nav__item ${isActive ? "is-active" : ""}`;
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegacao principal">
      <div className="bottom-nav__bar">
        <NavLink to="/" end className={navClass}>
          <CompassIcon size={20} />
          <span>Explorar</span>
        </NavLink>

        <NavLink to="/leaderboard" className={navClass}>
          <TrophyIcon size={20} />
          <span>Ranking</span>
        </NavLink>

        <span className="bottom-nav__spacer" aria-hidden />

        <NavLink to="/achievements" className={navClass}>
          <MedalIcon size={20} />
          <span>Conquistas</span>
        </NavLink>

        <NavLink to="/profile" className={navClass}>
          <UserIcon size={20} />
          <span>Perfil</span>
        </NavLink>
      </div>

      <NavLink to="/scan" className="bottom-nav__scan" aria-label="Ler QR Code">
        <ScanIcon size={23} />
      </NavLink>
    </nav>
  );
}
