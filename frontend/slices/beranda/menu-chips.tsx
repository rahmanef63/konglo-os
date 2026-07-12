"use client";

import { useNav, useIsDemo } from "@/frontend/shared";
import { MenuIcon } from "@/frontend/shared/menu-icon";
import { MENU } from "@/frontend/slices/menu";
import { canAccess, type Role } from "@/lib/roles";
import { safeColor } from "@/lib/safe-css";

// Compact quick-launch strip of the top accessible slices (excl. beranda),
// RBAC-filtered via canAccess. Chips → nav(slug). Navigation only, no data.
export function MenuChips({ role, limit = 8 }: { role: Role; limit?: number }) {
  const nav = useNav();
  const isDemo = useIsDemo();
  const items = MENU.filter(
    (m) => m.slug !== "beranda" && canAccess(role, m.slug, isDemo),
  ).slice(0, limit);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {items.map((m) => {
        const accent = safeColor(m.accent) ?? "var(--color-gold)";
        return (
          <button
            key={m.slug}
            type="button"
            onClick={() => nav(m.slug)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-[color,background-color,border-color,transform] duration-200 hover:border-primary/50 hover:bg-muted motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.98]"
          >
            <span className="shrink-0" style={{ color: accent }}>
              <MenuIcon name={m.slug} size={16} />
            </span>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
