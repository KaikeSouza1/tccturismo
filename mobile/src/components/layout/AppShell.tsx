import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ToastHost } from "../ui/ToastHost";
import "./AppShell.css";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <main className="app-shell__content">{children}</main>
      <ToastHost />
      <BottomNav />
    </div>
  );
}
