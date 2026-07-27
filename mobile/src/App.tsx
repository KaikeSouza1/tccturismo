import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { OrganizationScreen } from "./screens/OrganizationScreen";
import { AttractionDetailScreen } from "./screens/AttractionDetailScreen";
import { ScanScreen } from "./screens/ScanScreen";
import { AchievementsScreen } from "./screens/AchievementsScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

function SplashScreen() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-blue-800)",
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
  return <>{children}</>;
}

function RequireGuest({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
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
        path="/register"
        element={
          <RequireGuest>
            <RegisterScreen />
          </RequireGuest>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <HomeScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/attractions/:id"
        element={
          <RequireAuth>
            <AttractionDetailScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/organizations/:organizationId"
        element={
          <RequireAuth>
            <OrganizationScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/scan"
        element={
          <RequireAuth>
            <ScanScreen />
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
        path="/leaderboard"
        element={
          <RequireAuth>
            <LeaderboardScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfileScreen />
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
