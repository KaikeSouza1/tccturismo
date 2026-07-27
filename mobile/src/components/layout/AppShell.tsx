import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import "./AppShell.css";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <main className="app-shell__content">{children}</main>
      <BottomNav />
    </div>
  );
}
