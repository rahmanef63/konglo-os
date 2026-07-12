"use client";

import { Skeleton, useMe } from "@/frontend/shared";
import { type Role } from "@/lib/roles";
import { MobileHome } from "./mobile-home";
import { Launcher } from "./launcher";

// Beranda — the OS home, rebuilt as a calm "pure launcher" (Google-homepage
// feel): a centered search that opens the shared ⌘K CommandPalette, quick menu
// chips, then a feature-card directory. Owner decision: NO financial/data cards
// on home — net-worth, allocation donut, subsidiaries and "Sinyal Hari Ini" all
// stay on disk (signals-card.tsx + office queries) but are NOT rendered here.
// MOBILE (<md): MobileHome (simpler app-grid launcher). DESKTOP (md+): Launcher.
// RBAC is applied inside each via canAccess(role, slug); the shell blocks render
// until role resolves, but we still guard here.
export default function Screen() {
  // Effective role: a demo (anonymous) user is a principal here but the launcher
  // is DEMO_SLUGS-filtered via canAccess(role, slug, isDemo) downstream.
  const me = useMe();
  const role = (me?.isDemo ? "principal" : me?.role ?? null) as Role | null;
  if (me === undefined || !role) return <Skeleton className="h-44 w-full rounded-xl" />;

  return (
    <>
      <div className="md:hidden">
        <MobileHome role={role} />
      </div>
      <div className="hidden md:block">
        <Launcher role={role} />
      </div>
    </>
  );
}
