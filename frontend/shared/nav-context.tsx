"use client";

import { createContext, useContext } from "react";

// Lets any screen deep in the tree (notably the mobile home's app-grid tiles +
// widgets, rendered by ScreenHost which passes no props) switch the active slice
// without prop-threading. The shell provides setActive via NavProvider; consumers
// call useNav()(slug). State-based nav (no routes) — same setActive the sidebar,
// dock, and palette already funnel through.
const NavContext = createContext<((slug: string) => void) | null>(null);

export const NavProvider = NavContext.Provider;

export function useNav(): (slug: string) => void {
  const nav = useContext(NavContext);
  if (!nav) throw new Error("useNav must be used within NavProvider");
  return nav;
}
