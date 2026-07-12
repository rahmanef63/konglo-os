"use client";

import { Component, Suspense, type ComponentType, type ReactNode } from "react";
import { SCREENS } from "@/frontend/slices/registry";
import { canAccess, type Role } from "@/lib/roles";
import { captureError } from "@/lib/observability";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./glass-card";

// Per-panel error boundary: one slice throw degrades ONE panel, not the whole
// OS. Keyed by active slug upstream so switching tabs auto-recovers; the button
// resets in place. (React error boundaries must be class components.)
class ScreenBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    captureError(error, { boundary: "os/screen-boundary" });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <GlassCard className="max-w-md p-7 text-center">
          <h2 className="font-display text-lg font-bold text-foreground">
            Gagal memuat bagian ini
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Terjadi kesalahan pada panel ini. Coba lagi.
          </p>
          <Button
            size="sm"
            onClick={() => this.setState({ failed: false })}
            className="mt-5"
          >
            Coba lagi
          </Button>
        </GlassCard>
      </div>
    );
  }
}

// Skeleton stand-in for the auth/role bootstrap gate (replaces a bare "Memuat…").
export function ScreenSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// Renders the active slice: slug→screen lookup (falls back to beranda) wrapped
// in the per-panel error boundary + Suspense. `key={active}` upstream resets the
// boundary on tab switch so a previously-failed panel auto-recovers.
export function ScreenHost({
  active,
  role,
  isDemo,
}: {
  active: string;
  role: Role;
  isDemo: boolean;
}) {
  // Render-layer demo gate (defense-in-depth). The nav surfaces already hide
  // non-DEMO_SLUGS, but a demo user can still reach an off-limits slug via the
  // asisten handoff (search-widget / dock FAB, both exempt from the RBAC snap) or
  // a restored sessionStorage slug. Block it HERE so demo never renders a screen
  // that reads real Convex. Only applies to demo — real-user access (incl. the
  // asisten handoff for cfo/staf) is unchanged.
  if (isDemo && !canAccess(role, active, isDemo)) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <GlassCard className="max-w-md p-7 text-center">
          <h2 className="font-display text-lg font-bold text-foreground">
            Tidak tersedia dalam mode demo
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fitur ini memerlukan akun asli. Silakan keluar dari mode demo untuk
            masuk menggunakan akun Anda.
          </p>
        </GlassCard>
      </div>
    );
  }
  const Screen: ComponentType = SCREENS[active] ?? SCREENS.beranda;
  return (
    <ScreenBoundary key={active}>
      <Suspense fallback={<ScreenSkeleton />}>
        {/* Soft entrance on every tab switch — ScreenBoundary's key={active}
            remounts this, so the gated animate-screen replays once per slice
            (cached chunks animate on switch, lazy chunks on content arrival). */}
        <div className="animate-screen">
          <Screen />
        </div>
      </Suspense>
    </ScreenBoundary>
  );
}
