"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { MENU } from "@/frontend/slices/menu";
import { canAccess, type Role } from "@/lib/roles";
import { useIsDemo } from "./use-me";
import { rp } from "@/lib/format";

interface Item {
  key: string;
  group: string;
  title: string;
  sub: string;
  accent: string;
  slug: string;
}

// ⌘K palette: search features (role-gated) + live subsidiaries + contacts,
// jump to the owning screen. Ports prototype global search.
export function CommandPalette({
  open,
  onClose,
  onNavigate,
  role,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (slug: string) => void;
  role: Role;
}) {
  const isDemo = useIsDemo();
  // Gate both subscriptions on `open`: the shell mounts this unconditionally, so
  // an ungated useQuery keeps these two queries live on the WebSocket for the
  // whole session. Passing "skip" while closed means they only subscribe when
  // the palette is actually open.
  // Demo never reads the real tables — the palette's entity search is Convex-only,
  // so it's simply empty in demo (feature nav still works).
  const subs = useQuery(api.features.subsidiaries.queries.list, open && !isDemo ? {} : "skip");
  const contacts = useQuery(api.features.contacts.queries.list, open && !isDemo ? {} : "skip");
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Only auto-scroll the active option into view for keyboard nav, never on
  // mouse hover (which also moves `idx` and would yank the list under the cursor).
  const kbdNav = useRef(false);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const needle = q.trim().toLowerCase();
    const hit = (...xs: string[]) =>
      !needle || xs.some((x) => x.toLowerCase().includes(needle));
    const feats = MENU.filter((m) => canAccess(role, m.slug, isDemo))
      .filter((m) => hit(m.label, m.sub, m.tag))
      .map((m) => ({
        key: `f-${m.slug}`,
        group: "Fitur",
        title: m.label,
        sub: m.sub,
        accent: m.accent,
        slug: m.slug,
      }));
    const cos = (subs ?? [])
      .filter((s) => hit(s.name, s.sector))
      .slice(0, 5)
      .map((s) => ({
        key: `s-${s.slug}`,
        group: "Anak Usaha",
        title: s.name,
        sub: `${s.sector} · ${rp(s.revenue)}`,
        accent: s.color,
        slug: "portofolio-bisnis",
      }));
    const vips = (contacts ?? [])
      .filter((c) => hit(c.name, c.role, c.tier))
      .slice(0, 5)
      .map((c) => ({
        key: `c-${c.slug}`,
        group: "Kontak",
        title: c.name,
        sub: `${c.role} · ${c.tier}`,
        accent: "var(--color-mk-purple)",
        slug: "relasi-jaringan",
      }));
    return [...feats, ...cos, ...vips];
  }, [q, role, subs, contacts, isDemo]);

  const go = (item: Item) => {
    onNavigate(item.slug);
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian"
      className="animate-overlay fixed inset-0 z-50 bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass animate-dialog mx-auto mt-[10vh] w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="cmdk-listbox"
            aria-activedescendant={items[idx] ? `cmdk-opt-${items[idx].key}` : undefined}
            aria-autocomplete="list"
            aria-label="Cari fitur, anak usaha, kontak"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                kbdNav.current = true;
                setIdx((i) => Math.min(i + 1, items.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                kbdNav.current = true;
                setIdx((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && items[idx]) go(items[idx]);
            }}
            placeholder="Cari fitur, anak usaha, kontak…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
        </div>

        <div
          id="cmdk-listbox"
          role="listbox"
          aria-label="Hasil pencarian"
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {items.map((it, i) => (
            <div key={it.key} role="presentation">
              {(i === 0 || items[i - 1].group !== it.group) && (
                <div
                  role="presentation"
                  className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {it.group}
                </div>
              )}
              <button
                type="button"
                id={`cmdk-opt-${it.key}`}
                role="option"
                aria-selected={i === idx}
                onClick={() => go(it)}
                onMouseEnter={() => {
                  kbdNav.current = false;
                  setIdx(i);
                }}
                ref={(el) => {
                  if (i === idx && kbdNav.current) el?.scrollIntoView({ block: "nearest" });
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  i === idx ? "bg-muted/70" : "hover:bg-muted/40"
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: it.accent }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{it.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{it.sub}</span>
                </span>
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Tidak ada hasil.</div>
          )}
        </div>
        <div aria-live="polite" role="status" className="sr-only">
          {`${items.length} hasil${q.trim() ? ` untuk ${q.trim()}` : ""}`}
        </div>

        <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          ↑↓ navigasi · ↵ buka · esc tutup
        </div>
      </div>
    </div>,
    document.body,
  );
}
