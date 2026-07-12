"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  StatGrid,
  StatTile,
  SectionCard,
  DataRow,
  DetailSheet,
  DeleteButton,
  Meter,
  LegendDonut,
  FormModal,
  Skeleton,
  EmptyState,
  GoldButton,
  useIsDemo,
} from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { safeColor } from "@/lib/safe-css";
import { FOCUS, STATS } from "./data";
import { useFilantropiWrites, GRANT_FIELDS, DISBURSE_FIELDS } from "./writes";

// Filantropi — foundation grants + impact. The demo user sees the in-code mock
// (FOCUS donut + STATS KPI tiles + 91% ratio) and never reads Convex; a real user
// sees only their Convex grants/impact, with neutral "—"/EmptyState where there is
// no live source (Komitmen/Tersalurkan/Penerima + the 91% ratio have none).
// "Program Aktif" is derived live from the real grants list. Writes are hidden in
// demo (read-only).
export default function Screen() {
  const isDemo = useIsDemo();
  const grantsQ = useQuery(api.features.filantropi.queries.listGrants, isDemo ? "skip" : {});
  const impactQ = useQuery(api.features.filantropi.queries.listImpact, isDemo ? "skip" : {});
  const grants = isDemo ? [] : (grantsQ ?? []);
  const impact = isDemo ? [] : (impactQ ?? []);
  const [open, setOpen] = useState<Doc<"philanthropyGrants"> | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [disburse, setDisburse] = useState<Doc<"philanthropyGrants"> | null>(null);
  const { add, disburse: doDisburse, del } = useFilantropiWrites(grants.length);

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile label="Komitmen Donasi" value={isDemo ? STATS.commitment.value : "—"} accent sample={isDemo} />
        <StatTile label="Tersalurkan (YTD)" value={isDemo ? STATS.disbursed.value : "—"} tone="up" sample={isDemo} />
        <StatTile label="Penerima Manfaat" value={isDemo ? STATS.beneficiaries.value : "—"} sample={isDemo} />
        <StatTile label="Program Aktif" value={isDemo ? STATS.programs.value : grantsQ ? String(grants.length) : "—"} hint={STATS.programs.hint} sample={isDemo} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Program & Hibah"
          sub="Ketuk program untuk detail dampak"
          action={isDemo ? undefined : <GoldButton className="shrink-0" onClick={() => setAddOpen(true)} />}
        >
          {!isDemo && grantsQ === undefined ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : grants.length === 0 ? (
            <EmptyState
              message={
                isDemo
                  ? "Data program hibah tidak tersedia di mode demo."
                  : "Belum ada program hibah. Tambahkan program pertama yayasan."
              }
            />
          ) : (
            <div className="space-y-3">
              {grants.map((g) => (
                <button
                  key={g._id}
                  onClick={() => setOpen(g)}
                  className="block w-full rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: safeColor(g.color) }} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{g.name}</span>
                        <span className="block text-xs text-muted-foreground">{g.category}</span>
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-sm font-semibold text-foreground">{g.amount}</span>
                  </div>
                  <div className="mt-2">
                    <Meter value={g.progress} color={g.color} />
                  </div>
                  <div className="mt-1 text-right text-[11px] text-muted-foreground">{g.progress}% tersalurkan</div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Fokus Donasi">
          {isDemo ? (
            <LegendDonut segments={FOCUS} showValue size={130} />
          ) : (
            <EmptyState message="Belum ada data fokus donasi." />
          )}
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-center">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Rasio efisiensi program</div>
            <div className="mt-0.5 font-display text-2xl font-bold text-[color:var(--color-mk-green)]">
              {isDemo ? "91%" : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {isDemo ? "ke penerima manfaat · data contoh" : "ke penerima manfaat"}
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Dampak Terukur" sub="Outcome lintas program">
        {!isDemo && impactQ === undefined ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : impact.length === 0 ? (
          <EmptyState
            message={isDemo ? "Data dampak tidak tersedia di mode demo." : "Belum ada metrik dampak tercatat."}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {impact.map((m) => (
              <div key={m._id} className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <div className="font-display text-2xl font-bold text-foreground">{m.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <DetailSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow={open?.category}
        title={open?.name ?? ""}
        subtitle={open ? `Komitmen ${open.amount} · mitra ${open.partner}` : undefined}
        accent={open?.color}
        actions={
          open && !isDemo && (
            <>
              <DeleteButton label={open.name} onConfirm={async () => { await del(open._id, open.name); setOpen(null); }} />
              <Button
                size="sm"
                onClick={() => { setDisburse(open); setOpen(null); }}
              >
                Setujui pencairan
              </Button>
            </>
          )
        }
      >
        {open && (
          <>
            <DataRow label="Penerima manfaat" value={open.beneficiaries} accent />
            <DataRow label="Cakupan wilayah" value={open.region} />
            <DataRow label="Mitra pelaksana" value={open.partner} />
            <DataRow label="Komitmen" value={open.amount} />
            <div className="mt-4 space-y-2">
              <Meter value={open.progress} color={open.color} />
              <p className="text-right text-xs text-muted-foreground">{open.progress}% dana tersalurkan</p>
            </div>
          </>
        )}
      </DetailSheet>

      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Program"
        subtitle="Program baru langsung masuk daftar hibah yayasan"
        fields={GRANT_FIELDS}
        onSubmit={add}
      />

      <FormModal
        open={disburse !== null}
        onClose={() => setDisburse(null)}
        title={disburse ? `Setujui pencairan · ${disburse.name}` : "Setujui pencairan"}
        subtitle="Perbarui persentase dana yang tersalurkan"
        submitLabel="Setujui"
        accent={disburse?.color}
        initial={disburse ? { progress: disburse.progress } : undefined}
        fields={DISBURSE_FIELDS}
        onSubmit={async (v) => { if (disburse) await doDisburse(disburse._id, disburse.name, v, disburse.version); }}
      />
    </div>
  );
}
