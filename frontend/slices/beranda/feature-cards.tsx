"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, LayoutGrid, List as ListIcon } from "lucide-react";
import { useNav, useIsDemo } from "@/frontend/shared";
import { MenuIcon } from "@/frontend/shared/menu-icon";
import { MENU, type FeatureMeta } from "@/frontend/slices/menu";
import { canAccess, type Role } from "@/lib/roles";
import { safeColor } from "@/lib/safe-css";
import { cn } from "@/lib/utils";

type View = "card" | "list";

// Feature directory — a grouped accordion (native <details>) with a Card/List
// view toggle. DRY: ONE role-filtered MENU source (excl. beranda) feeds BOTH
// renderers (FeatureThumb / FeatureRow); groups come from menu.ts `group`.
export function FeatureCards({ role }: { role: Role }) {
  const nav = useNav();
  const isDemo = useIsDemo();
  const [view, setView] = useState<View>("card");
  const items = MENU.filter((m) => m.slug !== "beranda" && canAccess(role, m.slug, isDemo));
  if (items.length === 0) return null;

  const groups = [...new Set(items.map((m) => m.group ?? "Lainnya"))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{items.length} fitur</span>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          <ToggleBtn active={view === "card"} onClick={() => setView("card")} label="Tampilan kartu">
            <LayoutGrid className="h-4 w-4" />
          </ToggleBtn>
          <ToggleBtn active={view === "list"} onClick={() => setView("list")} label="Tampilan daftar">
            <ListIcon className="h-4 w-4" />
          </ToggleBtn>
        </div>
      </div>

      {groups.map((g) => {
        const gi = items.filter((m) => (m.group ?? "Lainnya") === g);
        return (
          <details key={g} open className="group overflow-hidden rounded-2xl border border-border bg-card/40">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 transition-colors hover:bg-muted/40">
              <span className="font-display text-sm font-semibold text-foreground">{g}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {gi.length}
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="border-t border-border p-3">
              {view === "card" ? (
                <div className="stagger grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {gi.map((m) => (
                    <FeatureThumb key={m.slug} meta={m} onClick={() => nav(m.slug)} />
                  ))}
                </div>
              ) : (
                <ul className="stagger divide-y divide-border">
                  {gi.map((m) => (
                    <FeatureRow key={m.slug} meta={m} onClick={() => nav(m.slug)} />
                  ))}
                </ul>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ToggleBtn({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "grid h-7 w-8 place-items-center rounded-md transition-colors",
        active
          ? "bg-[color:var(--color-gold)]/15 text-[color:var(--color-gold)]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// Card/thumbnail renderer — squircle icon + label + tag.
function FeatureThumb({ meta, onClick }: { meta: FeatureMeta; onClick: () => void }) {
  const accent = safeColor(meta.accent) ?? "var(--color-gold)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/thumb flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 text-left transition-[transform,box-shadow,border-color] duration-200 hover:border-primary/50 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
    >
      <span
        className="grid h-10 w-10 place-items-center rounded-xl border border-border transition-transform motion-safe:group-hover/thumb:scale-105"
        style={{ color: accent, background: `color-mix(in oklab, ${accent} 12%, transparent)` }}
      >
        <MenuIcon name={meta.slug} size={18} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-semibold text-foreground">{meta.label}</span>
        <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{meta.tag}</span>
      </span>
    </button>
  );
}

// List renderer — compact row with sub-label.
function FeatureRow({ meta, onClick }: { meta: FeatureMeta; onClick: () => void }) {
  const accent = safeColor(meta.accent) ?? "var(--color-gold)";
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left transition-colors hover:bg-muted/40"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border" style={{ color: accent }}>
          <MenuIcon name={meta.slug} size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{meta.label}</span>
          <span className="block truncate text-xs text-muted-foreground">{meta.sub}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-muted-foreground" />
      </button>
    </li>
  );
}
