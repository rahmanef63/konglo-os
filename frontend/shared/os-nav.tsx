"use client";

import { MENU } from "@/frontend/slices/menu";
import { canAccess, type Role } from "@/lib/roles";
import { MenuIcon } from "./menu-icon";
import { useIsDemo } from "./use-me";
import { cn } from "@/lib/utils";

// Desktop sidebar feature nav (vertical). In-app view switch (iOS-style), not
// URL navigation. Mobile uses the fixed bottom dock (OsDock) instead.
export function OsNav({
  role,
  active,
  onSelect,
}: {
  role: Role;
  active: string;
  onSelect: (slug: string) => void;
}) {
  const isDemo = useIsDemo();
  const items = MENU.filter((m) => canAccess(role, m.slug, isDemo));
  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-0.5">
      {items.map((m) => {
        const on = m.slug === active;
        return (
          <button
            key={m.slug}
            onClick={() => onSelect(m.slug)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors",
              on
                ? "bg-[color:var(--color-gold)]/12 text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{ color: on ? "var(--color-gold)" : undefined }}
            >
              <MenuIcon name={m.slug} size={16} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium leading-tight">
                {m.label}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {m.tag}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
