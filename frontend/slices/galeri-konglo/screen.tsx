"use client";

import { useMemo, useState } from "react";
import { Info, LayoutGrid, Search, Share2 } from "lucide-react";
import { GlassCard, StatGrid, StatTile } from "@/frontend/shared";
import { KONGLO_ASOF, KONGLO_GROUPS } from "./data";
import { buildEdges } from "./types";
import { KongloCard } from "./card";
import { KongloDetail } from "./detail";
import { KongloGraph } from "./graph";

// Galeri Konglo — public-data directory of Indonesian conglomerates. Static
// in-repo snapshot (see data.ts): identical for demo + real users, no Convex.
// The disclaimer banner is the legal posture — keep it FIRST and always visible.
export default function GaleriKongloScreen() {
  const [view, setView] = useState<"galeri" | "graf">("galeri");
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const sectors = useMemo(
    () => [...new Set(KONGLO_GROUPS.flatMap((g) => g.sectors))].sort(),
    [],
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return KONGLO_GROUPS.filter((g) => {
      if (sector && !g.sectors.includes(sector)) return false;
      if (!needle) return true;
      return [g.name, ...g.people.map((p) => p.name), ...g.companies.map((c) => c.name)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [q, sector]);

  const companies = KONGLO_GROUPS.reduce((n, g) => n + g.companies.length, 0);
  const people = KONGLO_GROUPS.reduce((n, g) => n + g.people.length, 0);

  return (
    <div className="space-y-4">
      {/* Legal disclaimer — dated, sourced, with a correction channel. */}
      <GlassCard className="border-[color:var(--color-gold)]/40 p-4">
        <div className="flex gap-2.5">
          <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-gold)]" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              Data publik per {KONGLO_ASOF}.
            </span>{" "}
            Seluruh informasi dikompilasi dari sumber terbuka di internet
            (Wikipedia, Forbes, media nasional — sumber tercantum di tiap
            dasbor) untuk <span className="text-foreground">demo aplikasi & riset pasar</span>.
            Bukan publikasi resmi grup mana pun dan bukan nasihat investasi;
            angka dapat berbeda dari kondisi terkini. Koreksi / keberatan:{" "}
            <a href="mailto:rahmanef63@gmail.com" className="underline underline-offset-2 hover:text-foreground">
              rahmanef63@gmail.com
            </a>{" "}
            — konten akan ditinjau & diperbarui.
          </p>
        </div>
      </GlassCard>

      <StatGrid>
        <StatTile label="Grup Konglomerat" value={String(KONGLO_GROUPS.length)} accent />
        <StatTile label="Perusahaan Kunci" value={String(companies)} />
        <StatTile label="Tokoh Publik" value={String(people)} />
        <StatTile label="Relasi Graf" value={String(buildEdges(KONGLO_GROUPS).length)} hint={view === "graf" ? "graf aktif" : "buka tab Graf"} tone="up" />
      </StatGrid>

      {/* Galeri / Graf view toggle. */}
      <div className="inline-flex rounded-xl border border-border p-0.5">
        {([
          ["galeri", "Galeri", LayoutGrid],
          ["graf", "Graf Relasi", Share2],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              view === id
                ? "bg-[color:var(--color-gold)]/12 text-[color:var(--color-gold)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon aria-hidden className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {view === "graf" ? (
        <KongloGraph groups={KONGLO_GROUPS} onOpen={setOpenId} />
      ) : (
      <>
      {/* Toolbar: search + sector filter chips. */}
      <div className="space-y-2.5">
        <label className="relative block max-w-md">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Cari grup, tokoh, atau perusahaan</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari grup, tokoh, atau perusahaan…"
            className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[null, ...sectors].map((s) => {
            const active = sector === s;
            return (
              <button
                key={s ?? "semua"}
                type="button"
                aria-pressed={active}
                onClick={() => setSector(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-[color:var(--color-gold)]/60 bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]"
                    : "border-border text-muted-foreground hover:border-[color:var(--color-gold)]/40 hover:text-foreground"
                }`}
              >
                {s ?? "Semua"}
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Tidak ada grup yang cocok dengan pencarian.
        </p>
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((g) => (
            <KongloCard key={g.id} group={g} onOpen={setOpenId} />
          ))}
        </div>
      )}
      </>
      )}

      <KongloDetail
        group={KONGLO_GROUPS.find((g) => g.id === openId) ?? null}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
