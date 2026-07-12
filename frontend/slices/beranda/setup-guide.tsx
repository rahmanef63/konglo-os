"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { ChevronDown, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useNav, useIsDemo, useHonorific } from "@/frontend/shared";
import { MenuIcon } from "@/frontend/shared/menu-icon";
import { MENU_BY_SLUG } from "@/frontend/slices/menu";
import { safeColor } from "@/lib/safe-css";

const DISMISS_KEY = "konglo.setup.dismissed";

// "Lengkapi data Anda" onboarding widget (beranda). Shows where to start filling
// data: a progress line + the top-3 EMPTY domains as first-step CTAs (tap → the
// slice whose form adds that domain's first row). Deliberately simple — filled/
// empty + one action, no relation graph (the owner's "don't overwhelm" ask).
// Self-retires: hidden once every visible domain is filled or the user dismisses.
export function SetupGuide() {
  // Demo doesn't complete real data → skip the query (it returns null for a
  // role-less user anyway); the guide is a real-user tool.
  const isDemo = useIsDemo();
  const data = useQuery(api.features.onboarding.queries.overview, isDemo ? "skip" : {});
  const nav = useNav();
  const honorific = useHonorific();
  const [showAll, setShowAll] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed || !data) return null;
  const { domains, total, filled } = data;
  if (total === 0 || filled === total) return null; // all done → self-retire

  const empty = domains.filter((d) => !d.filled);
  const shown = showAll ? empty : empty.slice(0, 3);
  const pct = Math.round((filled / total) * 100);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — just hide for this session */
    }
    setDismissed(true);
  };

  return (
    <section className="relative rounded-2xl border border-[color:var(--color-gold)]/30 bg-[color:var(--color-gold)]/5 p-4">
      <button
        type="button"
        aria-label="Sembunyikan panduan"
        onClick={dismiss}
        className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="pr-8">
        <h2 className="font-display text-base font-bold text-foreground">Lengkapi data {honorific}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {filled} dari {total} area telah terisi — perkenankan kami mulai dari yang paling penting.
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[color:var(--color-gold)] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {shown.map((d) => {
          const m = MENU_BY_SLUG[d.slug];
          if (!m) return null;
          const accent = safeColor(m.accent) ?? "var(--color-gold)";
          return (
            <li key={d.slug}>
              <button
                type="button"
                onClick={() => nav(d.slug)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-[color:var(--color-gold)]/50"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border"
                  style={{ color: accent }}
                >
                  <MenuIcon name={d.slug} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{m.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">Belum ada data — silakan mulai isi</span>
                </span>
                <span className="shrink-0 rounded-md bg-[color:var(--color-gold)]/15 px-2.5 py-1 text-[11px] font-semibold text-[color:var(--color-gold)]">
                  Mulai
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {empty.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-2.5 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {showAll ? "Tampilkan lebih sedikit" : `Lihat semua (${empty.length})`}
          <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (showAll ? "rotate-180" : "")} />
        </button>
      )}
    </section>
  );
}
