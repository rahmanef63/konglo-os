"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Search } from "lucide-react";
import { MENU_BY_SLUG } from "@/frontend/slices/menu";
import { Eyebrow } from "./eyebrow";
import { ActivityBell } from "./activity-bell";
import { Button } from "@/components/ui/button";
import { ThemePresetSwitcher } from "@/features/theme-presets";

export function OsTopbar({
  active,
  onOpenPalette,
}: {
  active: string;
  onOpenPalette: () => void;
}) {
  const { signOut } = useAuthActions();
  const m = MENU_BY_SLUG[active];
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pb-4">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Eyebrow>{m?.tag}</Eyebrow>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-mk-green)] motion-safe:animate-pulse" />
            Live
          </span>
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
          {m?.label ?? "Konglo OS"}
        </h1>
        <p className="truncate text-sm text-muted-foreground">{m?.sub}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Cari (⌘K)"
          className="flex h-11 w-11 items-center justify-center gap-2 rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground sm:h-8 sm:w-auto sm:justify-start sm:px-2.5"
        >
          <Search className="h-4 w-4" />
          <kbd className="hidden rounded border border-border px-1.5 text-[10px] sm:block">⌘K</kbd>
        </button>
        <ActivityBell />
        <ThemePresetSwitcher size="sm" />
        <Button variant="outline" size="sm" className="h-11 sm:h-8" onClick={() => void signOut()}>
          Keluar
        </Button>
      </div>
    </header>
  );
}
