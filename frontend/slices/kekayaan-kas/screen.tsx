"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  SectionCard,
  Pill,
  LineChart,
  Ring,
  FormModal,
  GoldButton,
  EmptyState,
  useIsDemo,
} from "@/frontend/shared";
import { rp } from "@/lib/format";
import { AllocList } from "./alloc-list";
import { CashPanels } from "./cash-panels";
import {
  useKekayaanWrites,
  FIG_FIELDS,
  ALLOC_FIELDS,
  figInitial,
  allocInitial,
} from "./writes";
import { NET_WORTH_TREND, LIQUIDITY, LIQUIDITY_HEALTH } from "./data";

type Alloc = Doc<"allocations">;

// Kekayaan & Kas — net worth + cash flow + liquidity. A DEMO user (anonymous)
// sees the in-code illustrative mock and never reads Convex; a REAL user sees
// only their live data (headline figures + allocations are Convex SSOT, editable
// by principal/cfo). The trend/ring/liquidity/cash-flow/scheduled-expense series
// are mock-only (no Convex table backs them), so they render for the demo user
// via SectionCard's `sample` pill and collapse to a neutral "Belum ada data"
// placeholder for a real user — layout stays stable either way.
export default function Screen() {
  const isDemo = useIsDemo();
  const fig = useQuery(api.features.office.queries.getFigures, isDemo ? "skip" : {});
  const allocations = useQuery(
    api.features.office.queries.listAllocations,
    isDemo ? "skip" : {},
  );
  const { saveFigures, saveAllocation, removeAllocation } = useKekayaanWrites();
  const [figOpen, setFigOpen] = useState(false);
  const [allocEdit, setAllocEdit] = useState<Alloc | null>(null);
  const [allocAdd, setAllocAdd] = useState(false);

  const totalAssets = fig ? fig.netWorth + fig.liabilitas : 0;
  const stat = (label: string, value: string, tone?: "up") => (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-xl font-bold ${tone === "up" ? "text-[color:var(--color-mk-green)]" : "text-foreground"}`}>{value}</div>
    </div>
  );
  // Neutral, layout-preserving placeholder for a mock-only chart when real.
  const blankChart = (h: number) => (
    <div
      style={{ height: h }}
      className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
    >
      Belum ada data
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Kekayaan Bersih"
          sub="Aset − liabilitas, konsolidasi"
          sample={isDemo}
          action={
            <div className="flex items-center gap-2">
              <Pill tone="accent">{fig ? rp(fig.netWorth) : "—"}</Pill>
              <GoldButton onClick={() => setFigOpen(true)} disabled={isDemo || !fig}>Ubah</GoldButton>
            </div>
          }
        >
          {isDemo ? (
            <LineChart points={NET_WORTH_TREND} color="var(--color-mk-green)" height={140} />
          ) : (
            blankChart(140)
          )}
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {stat("Total Aset", fig ? rp(totalAssets) : "—")}
            {stat("Liabilitas", fig ? rp(fig.liabilitas) : "—")}
            {stat("Rasio Utang", fig ? `${fig.debtRatio.toLocaleString("id-ID")}%` : "—", "up")}
          </div>
        </SectionCard>

        <SectionCard title="Likuiditas" sub="Dana siap pakai" sample={isDemo}>
          {isDemo ? (
            <div className="flex items-center gap-4">
              <Ring value={LIQUIDITY_HEALTH} label="sehat" color="var(--color-mk-green)" size={104} />
              <div className="min-w-0 flex-1 space-y-2.5">
                {LIQUIDITY.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="Belum ada data likuiditas." />
          )}
        </SectionCard>
      </div>

      <AllocList
        allocations={allocations}
        onAdd={() => setAllocAdd(true)}
        onEdit={setAllocEdit}
        onRemove={removeAllocation}
      />

      <CashPanels />

      <FormModal
        open={figOpen}
        onClose={() => setFigOpen(false)}
        title="Ubah Angka Kekayaan"
        subtitle="Aset, liabilitas & rasio · langsung jadi SSOT beranda"
        fields={FIG_FIELDS}
        initial={fig ? figInitial(fig) : undefined}
        onSubmit={(v) => saveFigures(v, fig?.version)}
      />
      <FormModal
        open={allocAdd || allocEdit !== null}
        onClose={() => { setAllocAdd(false); setAllocEdit(null); }}
        title={allocEdit ? "Ubah Alokasi" : "Tambah Alokasi"}
        subtitle="Nilai kelas aset dalam Rupiah · donut menyesuaikan proporsi"
        fields={ALLOC_FIELDS}
        initial={allocEdit ? allocInitial(allocEdit) : undefined}
        submitLabel={allocEdit ? "Simpan" : "Tambah"}
        onSubmit={(v) => saveAllocation(v, allocEdit?.slug, allocEdit?.version)}
      />
    </div>
  );
}
