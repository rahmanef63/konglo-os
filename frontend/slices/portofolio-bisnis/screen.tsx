"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  StatGrid,
  StatTile,
  SectionCard,
  DataRow,
  DetailSheet,
  DeleteButton,
  BarChart,
  FormModal,
  useIsDemo,
} from "@/frontend/shared";
import { SUBSIDIARIES_MOCK } from "@/mock-data/portofolio-bisnis";
import { Button } from "@/components/ui/button";
import { rp, pct } from "@/lib/format";
import { usePortfolioWrites } from "./writes";
import { CoList } from "./co-list";
import { ADD_FIELDS, subInitial, SORTS, type Sub } from "./data";

// Portofolio Bisnis — holding map + per-subsidiary P&L. Live Convex SSOT.
export default function Screen() {
  const isDemo = useIsDemo();
  // Demo reads the in-code mock and skips Convex entirely — this slice is
  // fully Convex-backed, so without the skip a demo user would see the real
  // subsidiaries table.
  const subsQ = useQuery(api.features.subsidiaries.queries.list, isDemo ? "skip" : {});
  const subs = isDemo ? SUBSIDIARIES_MOCK : subsQ;
  const [sort, setSort] = useState("rev");
  const [open, setOpen] = useState<Sub | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editSub, setEditSub] = useState<Sub | null>(null);

  const cos = useMemo(() => [...(subs ?? [])].sort(SORTS[sort]), [subs, sort]);
  const { add: addSub, edit: editSubFn, del: delSub } = usePortfolioWrites(cos.length);
  const groupRev = cos.reduce((s, c) => s + c.revenue, 0);
  const avgMargin = cos.length ? cos.reduce((s, c) => s + c.margin, 0) / cos.length : 0;
  const avgOwn = cos.length ? cos.reduce((s, c) => s + c.ownership, 0) / cos.length : 0;
  const sectors = [...new Set(cos.map((c) => c.sector))];

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile label="Anak Usaha" value={subs ? String(cos.length) : "—"} hint={`${sectors.length} sektor`} />
        <StatTile label="Pendapatan Grup" value={subs ? rp(groupRev) : "—"} hint="total anak usaha" accent />
        <StatTile label="Margin EBITDA" value={subs ? pct(avgMargin).replace("+", "") : "—"} hint="rata-rata grup" />
        <StatTile label="Kepemilikan" value={subs ? `${Math.round(avgOwn)}%` : "—"} hint="rata-rata efektif" />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <SectionCard title="Peta Holding" sub="Struktur grup induk → anak usaha">
          <div className="flex flex-col items-center gap-1.5">
            <span className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold tracking-wide text-background">
              KONGLO HOLDING
            </span>
            <span className="h-4 w-px bg-border" />
            <div className="grid w-full grid-cols-3 gap-2">
              {sectors.map((s) => (
                <span key={s} className="rounded-lg border border-border bg-muted/40 px-2 py-2 text-center text-xs text-muted-foreground">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-border/60 pt-3">
            <BarChart values={cos.map((c) => c.revenue / 1e12)} color="var(--color-mk-blue)" height={84} highlightLast={false} />
            <p className="mt-1.5 text-center text-xs text-muted-foreground">Kontribusi pendapatan per anak usaha</p>
          </div>
        </SectionCard>

        <CoList
          cos={cos}
          loading={subs === undefined}
          sort={sort}
          onSort={setSort}
          onAdd={isDemo ? undefined : () => setAddOpen(true)}
          onOpen={setOpen}
        />
      </div>

      <DetailSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow={open?.sector}
        title={open?.name ?? ""}
        subtitle={open ? `Kepemilikan ${open.ownership}% · ${open.sector}` : undefined}
        accent={open?.color}
        actions={
          open && !isDemo && (
            <>
              <DeleteButton label={open.name} onConfirm={async () => { await delSub(open._id, open.name); setOpen(null); }} />
              <Button size="sm" onClick={() => { setEditSub(open); setOpen(null); }}>
                Ubah
              </Button>
            </>
          )
        }
      >
        {open && (
          <>
            <DataRow label="Pendapatan (TTM)" value={rp(open.revenue)} accent />
            <DataRow label="Margin EBITDA" value={`${open.margin}%`} />
            <DataRow label="EBITDA (estimasi)" value={rp((open.revenue * open.margin) / 100)} />
            <DataRow label="Pertumbuhan margin" value={pct(open.trend)} />
            <DataRow label="Kepemilikan efektif" value={`${open.ownership}%`} />
            <div className="mt-4">
              <BarChart
                values={[open.revenue, (open.revenue * open.margin) / 100, Math.max(open.revenue * 0.08, 1)].map((v) => v / 1e12)}
                color={open.color}
                height={70}
              />
              <p className="mt-1.5 text-center text-xs text-muted-foreground">Pendapatan · EBITDA · Laba bersih</p>
            </div>
          </>
        )}
      </DetailSheet>

      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Anak Usaha"
        subtitle="Entitas baru langsung masuk portofolio grup"
        fields={ADD_FIELDS}
        onSubmit={addSub}
      />

      <FormModal
        open={editSub !== null}
        onClose={() => setEditSub(null)}
        title={editSub ? `Ubah · ${editSub.name}` : "Ubah Anak Usaha"}
        subtitle="Perbarui pendapatan, margin & kepemilikan entitas"
        fields={ADD_FIELDS}
        submitLabel="Perbarui"
        accent={editSub?.color}
        initial={editSub ? subInitial(editSub) : undefined}
        onSubmit={async (v) => { if (editSub) await editSubFn(editSub._id, v, editSub.version); }}
      />
    </div>
  );
}
