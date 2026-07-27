import { NavLink } from "react-router-dom";
import { Compass, LayoutDashboard, Landmark, Trophy, ListChecks, LogOut, Building2 } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import "./Sidebar.css";

const ORG_NAV_ITEMS = [
  { to: "/", label: "Painel", icon: LayoutDashboard, order: "01", tone: "blue" },
  { to: "/attractions", label: "Atrativos", icon: Landmark, order: "02", tone: "trail" },
  { to: "/achievements", label: "Conquistas", icon: Trophy, order: "03", tone: "amber" },
  { to: "/visits", label: "Visitas", icon: ListChecks, order: "04", tone: "kraft" },
] as const;

const PLATFORM_NAV_ITEMS = [
  { to: "/", label: "Organizacoes", icon: Building2, order: "01", tone: "blue" },
  { to: "/achievements", label: "Conquistas", icon: Trophy, order: "02", tone: "amber" },
] as const;

const TILTS = [-1.6, 1.3, -1.1, 1.5, -1.3];

export function Sidebar() {
  const { user, logout } = useAuth();
  const isPlatformAdmin = user?.role === "platform_admin";
  const navItems = isPlatformAdmin ? PLATFORM_NAV_ITEMS : ORG_NAV_ITEMS;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">
          <Compass size={18} strokeWidth={2} />
        </span>
        <div className="sidebar__brand-text">
          <strong>Trilha Local</strong>
          <span>{isPlatformAdmin ? "administracao da plataforma" : "painel administrativo"}</span>
        </div>
      </div>

      <div className="sidebar__org">
        <span className="sidebar__org-tag">
          <Building2 size={11} strokeWidth={2.2} />
          {isPlatformAdmin ? "conta" : "organizacao"}
        </span>
        <span className="sidebar__org-name">{isPlatformAdmin ? "chefona" : user?.organizationName}</span>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `sidebar__tab sidebar__tab--${item.tone}${isActive ? " sidebar__tab--active" : ""}`
            }
            style={{ ["--tilt" as string]: `${TILTS[index % TILTS.length]}deg` }}
          >
            <span className="sidebar__tab-stamp">{item.order}</span>
            <item.icon size={17} strokeWidth={2} className="sidebar__tab-icon" />
            <span className="sidebar__tab-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__user-badge">{user?.name?.trim().charAt(0).toUpperCase()}</span>
        <div className="sidebar__user">
          <span className="sidebar__user-name">{user?.name}</span>
          <span className="sidebar__user-email">{user?.email}</span>
        </div>
        <button className="sidebar__logout" onClick={logout} type="button" aria-label="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
