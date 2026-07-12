"use client";

import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { MENU } from "@/frontend/slices/menu";
import { SCREENS } from "@/frontend/slices/registry";
import { canAccess, type Role } from "@/lib/roles";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandMark } from "./brand-mark";
import { DemoBanner } from "./demo-banner";
import { OnboardingDialog } from "./onboarding-dialog";
import { OsNav } from "./os-nav";
import { OsDock } from "./os-dock";
import { OsTopbar } from "./os-topbar";
import { useOsBootstrap } from "./use-os-bootstrap";
import { NavProvider } from "./nav-context";
import { ChatProvider } from "./chat-context";
import { ToastProvider } from "./toast";
import { CommandPalette } from "./command-palette";
import { MoreDrawer } from "./more-drawer";
import { ScreenHost, ScreenSkeleton } from "./os-screen-host";

// Persist the open slice so a browser refresh restores it instead of snapping
// back to beranda. sessionStorage (tab-scoped) over URL so the existing /os
// route + proxy gating stay untouched. SSR can't read it, so we hydrate with
// "beranda" (matches server HTML) then restore on mount — no hydration drift.
const ACTIVE_KEY = "konglo.os.active";

// Adaptive OS shell: sidebar (md+) / fixed bottom dock (mobile). Role-gated menu.
export function OsShell() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  // me: identity + demo status. undefined = still loading; null = signed out.
  const me = useQuery(api.features.rbac.queries.me);
  const isDemo = me?.isDemo ?? false;
  // Effective role: a demo (anonymous) user is a principal in the UI — sees every
  // menu — but every screen sources its data from the in-code mock (useDemoValue),
  // never Convex. A real user gets their granted role; null = authed-but-no-role
  // (Google login off the allowlist) → the "no access" state below.
  const role = (
    me === undefined ? undefined : isDemo ? "principal" : (me?.role ?? null)
  ) as Role | null | undefined;
  const [active, setActive] = useState("beranda");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Demo users never bootstrap: no role claim, no seed — nothing written to the
  // shared Convex tables for a throwaway anonymous session.
  useOsBootstrap(isAuthenticated && !isDemo);

  // Record coarse locale context (browser time zone + locale) once per shell
  // mount for REAL users — powers the "where/when" columns in the principal's
  // access roster. Client-volunteered, NO IP/geo. Fire-and-forget; the mutation
  // also skips anonymous demo guests server-side. Runs once, after identity loads.
  const recordLogin = useMutation(api.features.rbac.mutations.recordLogin);
  const loggedRef = useRef(false);
  useEffect(() => {
    if (loggedRef.current || !isAuthenticated || isDemo || me === undefined) return;
    loggedRef.current = true;
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      void recordLogin({ timeZone, locale: navigator.language }).catch(() => {});
    } catch {
      /* Intl/navigator unavailable — non-fatal; the roster just lacks the hint. */
    }
  }, [isAuthenticated, isDemo, me, recordLogin]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  // Restore the last-open slice on mount (client only). Only accept a slug that
  // still maps to a real screen; the RBAC snap effect below corrects it if the
  // role can't access it. Runs once — later changes are persisted by the effect
  // that follows, so nav clicks / palette / snap all survive refresh.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ACTIVE_KEY);
      if (saved && saved in SCREENS) setActive(saved);
    } catch {
      /* sessionStorage unavailable (private mode / SSR) — keep beranda. */
    }
  }, []);

  // Persist every active-slice change (nav, palette, RBAC snap all flow here).
  useEffect(() => {
    try {
      sessionStorage.setItem(ACTIVE_KEY, active);
    } catch {
      /* non-fatal: refresh just won't restore. */
    }
  }, [active]);

  // Global ⌘K / Ctrl+K → command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Snap to first allowed feature if role loses access to the active one.
  // `asisten` (the AI chatroom) is exempt: it's reachable by any signed-in role
  // via the launcher chat handoff, so it isn't in every role's ROLE_MENU and the
  // snap must not bounce them out of a conversation they just started.
  useEffect(() => {
    if (role && active !== "asisten" && !canAccess(role, active, isDemo)) {
      const first = MENU.find((m) => canAccess(role, m.slug, isDemo));
      if (first) setActive(first.slug);
    }
  }, [role, active, isDemo]);

  if (isLoading || !isAuthenticated || role === undefined) {
    return (
      <div
        role="status"
        aria-label="Memuat Konglo OS"
        className="flex h-dvh overflow-hidden"
      >
        <span className="sr-only">Memuat…</span>
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border bg-card/40 p-4 md:flex md:flex-col">
          <div className="mb-5 flex items-center gap-2.5 px-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <ScreenSkeleton />
        </main>
      </div>
    );
  }

  // Authenticated but no role row (role === null) → not on the allowlist and not
  // yet granted a role by the principal. Clear locked-out state (no data), not an
  // infinite skeleton. The admin surface (principal) can grant them a role.
  if (role === null) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="max-w-sm">
          <BrandMark variant="mark" className="mx-auto mb-3 h-11" />
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Konglo OS</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
            Akun belum memperoleh akses
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Anda telah berhasil masuk, namun akun ini belum memiliki peran yang
            ditetapkan. Silakan hubungi pemilik (principal) untuk memperoleh
            akses ke ruang kerja.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-gold/50"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <NavProvider value={setActive}>
      <ChatProvider>
      {/* First-run guide (real users only; self-gates on demo/dismissed). */}
      <OnboardingDialog />
      {/* Fixed-viewport shell: the container owns the height (h-dvh) and clips
          overflow, so the sidebar and the content main each scroll INDEPENDENTLY
          instead of the whole page scrolling as one column. */}
      <div className="flex h-dvh overflow-hidden">
        {/* Skip link (WCAG 2.4.1 Bypass Blocks): first focusable element, lets
            keyboard users jump past the sidebar to content on every screen. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
        >
          Lewati ke konten
        </a>
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border bg-card/40 p-4 md:flex md:flex-col">
          <div className="mb-5 flex items-center gap-2.5 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-border">
              <BrandMark variant="mark" className="h-5" />
            </span>
            <span className="text-sm font-semibold tracking-[0.14em]">
              KONGLO <span className="text-[color:var(--color-gold)]">OS</span>
            </span>
          </div>
          <OsNav role={role} active={active} onSelect={setActive} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto p-5 sm:p-7 focus:outline-none"
          >
            <OsTopbar
              active={active}
              onOpenPalette={() => setPaletteOpen(true)}
            />
            <DemoBanner />
            <ScreenHost active={active} role={role} isDemo={isDemo} />
            {/* Clearance so the fixed mobile dock never covers the last row —
                matches the dock's safe-area-aware height (incl. iOS home bar). */}
            <div
              aria-hidden
              className="h-[calc(6rem+env(safe-area-inset-bottom))] md:hidden"
            />
          </main>
        </div>
      </div>

      <OsDock
        role={role}
        active={active}
        onSelect={setActive}
        onOpenMenu={() => setDrawerOpen(true)}
      />

      {/* Mobile "Semua Fitur" drawer (dock Menu slot). Lists every role-accessible
          item incl. Admin & Akses — surfaces the principal's admin surface on mobile. */}
      <MoreDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
        active={active}
        onSelect={setActive}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setActive}
        role={role}
      />
      </ChatProvider>
      </NavProvider>
    </ToastProvider>
  );
}
