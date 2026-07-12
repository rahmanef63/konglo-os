"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Modal } from "./modal";
import { MenuIcon } from "./menu-icon";
import { MENU } from "@/frontend/slices/menu";
import { canAccess, type Role } from "@/lib/roles";
import { useIsDemo } from "./use-me";
import { safeColor } from "@/lib/safe-css";

// Mobile "Semua Fitur" drawer — a CareerPack-style bottom sheet (built on the
// Modal primitive, which already slides up via animate-sheet + traps focus +
// locks scroll; NO vaul dependency). Opened from the dock's Menu slot. Lists
// EVERY role-accessible MENU item as an app tile — so a principal on mobile can
// reach "Admin & Akses" (previously buried past the dock's top tabs). DRY: same
// MENU + canAccess source as the dock/sidebar; search filters the same list.
export function MoreDrawer({
  open,
  onClose,
  role,
  active,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  role: Role;
  active: string;
  onSelect: (slug: string) => void;
}) {
  const [q, setQ] = useState("");
  const { signOut } = useAuthActions();
  const isDemo = useIsDemo();
  const tiles = useMemo(() => {
    const n = q.trim().toLowerCase();
    return MENU.filter((m) => canAccess(role, m.slug, isDemo)).filter(
      (m) => !n || `${m.label} ${m.tag} ${m.sub}`.toLowerCase().includes(n),
    );
  }, [q, role, isDemo]);

  const pick = (slug: string) => {
    onSelect(slug);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} label="Semua Fitur">
      {/* Tall flex column: header + sticky search, scrollable grid, pinned footer.
          min-h-0 on the scroll region is REQUIRED or the grid pushes the footer off. */}
      <div className="flex h-[min(88dvh,680px)] w-full flex-col">
        <span aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border" />
        <div className="px-5 pb-3 pr-12 pt-2">
          <h2 className="font-display text-lg font-bold text-foreground">Semua Fitur</h2>
          <p className="text-xs text-muted-foreground">Pilih menu untuk membuka</p>
        </div>
        <div className="border-y border-border px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Cari fitur…"
              aria-label="Cari fitur"
              className="w-full rounded-lg border border-border bg-background/60 py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[color:var(--color-gold)]/60 focus:ring-1 focus:ring-[color:var(--color-gold)]/40"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tiles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada fitur cocok.</p>
          ) : (
            <div className="stagger grid grid-cols-3 gap-x-2 gap-y-4 min-[380px]:grid-cols-4">
              {tiles.map((m) => {
                const accent = safeColor(m.accent) ?? "var(--color-gold)";
                return (
                  <button
                    key={m.slug}
                    type="button"
                    aria-label={m.label}
                    aria-current={m.slug === active ? "page" : undefined}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      pick(m.slug);
                    }}
                    className="group flex flex-col items-center gap-1.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-gold)]"
                  >
                    <span
                      className={
                        "grid h-14 w-14 place-items-center rounded-[28%] border shadow-sm transition-transform motion-safe:group-active:scale-95 " +
                        (m.slug === active
                          ? "border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/12"
                          : "border-border bg-card")
                      }
                      style={{ color: accent }}
                    >
                      <MenuIcon name={m.slug} size={24} />
                    </span>
                    <span className="line-clamp-2 min-h-[2rem] text-center text-[11px] font-medium leading-tight text-foreground/85">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pinned footer — role badge + sign out. Clears the iOS home indicator. */}
        <footer
          className="flex items-center justify-between border-t border-border px-5 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <p className="text-[11px] text-muted-foreground">
            Peran:{" "}
            <span className="font-medium uppercase tracking-wide text-foreground">{role}</span>
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-[color:var(--color-gold)]/50"
          >
            Keluar
          </button>
        </footer>
      </div>
    </Modal>
  );
}
