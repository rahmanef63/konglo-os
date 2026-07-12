"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionCard, Skeleton } from "@/frontend/shared";
import { MENU_BY_SLUG } from "@/frontend/slices/menu";
import { timeAgoID } from "@/lib/format";
import type { Role } from "@/lib/roles";

const ROLE_LABEL: Record<Role, string> = { principal: "Principal", cfo: "CFO", staf: "Staf" };

// Data-completeness at a glance — reuses the SAME onboarding.overview query as
// the beranda SetupGuide (principal sees all domains). No new backend.
export function DataHealth() {
  const data = useQuery(api.features.onboarding.queries.overview);
  return (
    <SectionCard title="Kelengkapan Data" sub="Area yang sudah terisi vs belum — sumber tunggal dengan panduan Beranda.">
      {data === undefined ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : !data || data.total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada area untuk ditinjau.</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              {data.filled} dari {data.total} area terisi
            </span>
            <span className="font-display text-lg font-bold text-foreground">
              {Math.round((data.filled / data.total) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[color:var(--color-gold)] transition-[width] duration-500"
              style={{ width: `${Math.round((data.filled / data.total) * 100)}%` }}
            />
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {data.domains.map((d) => {
              const m = MENU_BY_SLUG[d.slug];
              return (
                <li key={d.slug} className="flex items-center gap-1.5 text-xs">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${d.filled ? "bg-[color:var(--color-mk-green)]" : "bg-border"}`}
                  />
                  <span className={d.filled ? "text-foreground" : "text-muted-foreground"}>
                    {m?.label ?? d.slug}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </SectionCard>
  );
}

// Org-wide audit feed — principal-only oversight of EVERY actor (esp. the cfo
// per SEC-001). Access grants/revocations and data writes surface here with the
// actor's email + role, so the owner can review who did what.
export function OrgActivity() {
  const items = useQuery(api.features.activity.queries.allRecent, { limit: 40 });
  return (
    <SectionCard title="Aktivitas Organisasi" sub="Jejak seluruh pengguna — hanya principal. Termasuk perubahan akses.">
      {items === undefined ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Belum ada aktivitas.</p>
      ) : (
        <ul className="max-h-96 space-y-1 overflow-y-auto">
          {items.map((i) => (
            <li key={i._id} className="flex gap-2.5 rounded-lg px-1.5 py-2 hover:bg-muted/40">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-gold)]" />
              <div className="min-w-0 flex-1">
                <div className="text-sm leading-snug text-foreground">{i.label}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {i.actor}
                  {i.role ? ` · ${ROLE_LABEL[i.role]}` : ""}
                  {i.meta ? ` · ${i.meta}` : ""} · {timeAgoID(i.at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
