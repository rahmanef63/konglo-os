"use client";

import { ExternalLink } from "lucide-react";
import { DetailSheet, Pill } from "@/frontend/shared";
import { KONGLO_ASOF } from "./data";
import { buildEdges, type KongloGroup } from "./types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

// "Dasbor konglo" — the drill-down for one group. Read-only public snapshot;
// the Relasi list is buildEdges() output, i.e. exactly what the future
// Obsidian-style graph will draw.
export function KongloDetail({
  group,
  onClose,
}: {
  group: KongloGroup | null;
  onClose: () => void;
}) {
  if (!group) return null;
  const edges = buildEdges([group]);
  return (
    <DetailSheet
      open
      onClose={onClose}
      eyebrow="Galeri Konglo · Data Publik"
      title={group.name}
      subtitle={group.summary}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Berdiri</div>
          <div className="mt-0.5 font-display text-lg font-bold">{group.founded ?? "—"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Kantor Pusat</div>
          <div className="mt-0.5 font-display text-lg font-bold">{group.hq ?? "—"}</div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Estimasi Kekayaan</div>
          <div className="mt-0.5 font-display text-lg font-bold text-[color:var(--color-gold)]">
            {group.netWorth ? `US$${group.netWorth.valueBUSD} miliar` : "—"}
          </div>
          {group.netWorth && (
            <div className="text-[11px] text-muted-foreground">
              {group.netWorth.holder} · {group.netWorth.source} {group.netWorth.year}
            </div>
          )}
        </div>
      </div>

      <Section title="Tokoh Kunci">
        <ul className="space-y-1">
          {group.people.map((p) => (
            <li key={p.id} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-foreground">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.role}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Perusahaan Kunci">
        <ul className="flex flex-wrap gap-1.5">
          {group.companies.map((c) => (
            <li key={c.id}>
              <Pill>
                {c.name}
                {c.ticker ? ` · ${c.ticker}` : ""}
              </Pill>
            </li>
          ))}
        </ul>
      </Section>

      {group.notable && group.notable.length > 0 && (
        <Section title="Catatan">
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {group.notable.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Relasi (${edges.length}) — pratinjau graf`}>
        <ul className="max-h-32 space-y-0.5 overflow-y-auto font-mono text-[11px] text-muted-foreground">
          {edges.map((e) => (
            <li key={`${e.from}-${e.to}`} className="truncate">
              {e.from} —{e.rel}→ {e.to}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Sumber">
        <ul className="space-y-1">
          {group.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                <ExternalLink aria-hidden className="h-3 w-3" />
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <p className="mt-5 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Snapshot data publik per {KONGLO_ASOF} — demo aplikasi & riset pasar, bukan
        publikasi resmi grup. Akses penuh (berbayar) — segera.
      </p>
    </DetailSheet>
  );
}
