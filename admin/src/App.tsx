import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { AppShell } from "./components/layout/AppShell";
import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { AttractionsScreen } from "./screens/AttractionsScreen";
import { AchievementsScreen } from "./screens/AchievementsScreen";
import { VisitsScreen } from "./screens/VisitsScreen";
import { OrganizationsScreen } from "./screens/OrganizationsScreen";

function SplashScreen() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-blue-950)",
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontSize: 20,
      }}
    >
      TuriStar
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;
  if (!token) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

/** Telas ligadas a uma organizacao (Painel/Atrativos/Visitas) nao existem
 * para a conta de plataforma, que nao pertence a organizacao nenhuma. */
function RequireOrganization({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "platform_admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireGuest({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomeRoute() {
  const { user } = useAuth();
  return user?.role === "platform_admin" ? <OrganizationsScreen /> : <DashboardScreen />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RequireGuest>
            <LoginScreen />
          </RequireGuest>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <HomeRoute />
          </RequireAuth>
        }
      />
      <Route
        path="/attractions"
        element={
          <RequireAuth>
            <RequireOrganization>
              <AttractionsScreen />
            </RequireOrganization>
          </RequireAuth>
        }
      />
      <Route
        path="/achievements"
        element={
          <RequireAuth>
            <AchievementsScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/visits"
        element={
          <RequireAuth>
            <RequireOrganization>
              <VisitsScreen />
            </RequireOrganization>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
