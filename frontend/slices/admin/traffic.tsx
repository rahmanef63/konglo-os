"use client";

// Admin · Trafik Situs — cookieless visitor analytics from the self-hosted
// beacon: page views + referrers + geo (country/city via geoip). Two windows
// (7d/30d) off one summary query. principal-only (the menu hides it from
// cfo/staf; the query is server-gated by requireAdmin). Reuses the repo's
// SectionCard + StatTile/StatGrid + BarChart primitives (rr: compose, no hex).
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionCard, StatTile, StatGrid, BarChart, Skeleton } from "@/frontend/shared";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const MONTH = 30 * 24 * 60 * 60 * 1000;
const num = (n: number) => n.toLocaleString("id-ID");

// Horizontal ranked list: label + proportional gold bar + count. Matches the
// DataHealth progress-bar idiom (muted track + gold fill, theme tokens only).
function TopList({
  title,
  items,
  unit,
}: {
  title: string;
  items: { key: string; count: number }[];
  unit?: string;
}) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((i) => i.count)) || 1;
  return (
    <div>
      <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-2.5">
            <span className="w-2/5 shrink-0 truncate text-xs text-foreground" title={it.key}>
              {it.key}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-[color:var(--color-gold)]"
                style={{ width: `${Math.round((it.count / max) * 100)}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {num(it.count)}
              {unit ?? ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminTrafficCard() {
  const d7 = useQuery(api.features.pageviews.queries.summary, { sinceMs: WEEK });
  const d30 = useQuery(api.features.pageviews.queries.summary, { sinceMs: MONTH });
  const loading = d7 === undefined || d30 === undefined;

  return (
    <SectionCard
      title="Trafik Situs"
      sub="Beacon swakelola tanpa cookie — kunjungan, perujuk & geo (kota via geoip). Tanpa cookie, tanpa IP tersimpan. Hanya principal."
    >
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <StatGrid>
            <StatTile label="Kunjungan · 7 hr" value={num(d7.total)} accent />
            <StatTile label="Unik · 7 hr" value={num(d7.uniqueSessions)} />
            <StatTile label="Kunjungan · 30 hr" value={num(d30.total)} />
            <StatTile label="Negara teratas" value={d30.topCountries[0]?.key ?? "—"} />
          </StatGrid>

          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Volume · 30 hari
            </h3>
            {d30.perDay.length > 0 ? (
              <div className="mt-2">
                <BarChart values={d30.perDay.map((p) => p.count)} height={110} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Belum ada data.</p>
            )}
          </div>

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <TopList title="Halaman teratas · 7 hr" items={d7.topPaths} unit="×" />
            <TopList title="Perujuk · 7 hr" items={d7.topReferrers} />
            <TopList title="Negara · 30 hr" items={d30.topCountries} />
            <TopList title="Kota · 30 hr" items={d30.topCities} />
          </div>

          {d7.total === 0 && d30.total === 0 && (
            <p className="text-sm text-muted-foreground">
              Belum ada kunjungan terekam. Data muncul setelah pengunjung membuka
              halaman publik (Beranda / Pendekatan).
            </p>
          )}
          {(d7.capped || d30.capped) && (
            <p className="text-xs text-muted-foreground">
              Batas {num(10000)} baris tercapai — angka mungkin under-count. Tambah
              agregasi harian bila trafik tumbuh.
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
