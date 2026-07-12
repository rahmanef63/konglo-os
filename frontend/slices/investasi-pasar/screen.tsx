"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  StatGrid,
  StatTile,
  SectionCard,
  PillToggleRow,
  DataRow,
  DetailSheet,
  LineChart,
  LegendDonut,
  FormModal,
  Skeleton,
  EmptyState,
  useIsDemo,
} from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { rp } from "@/lib/format";
import { useInvestasiWrites } from "./writes";
import { HoldingsList } from "./holdings-list";
import {
  DAY_CHANGE, YTD, BENCHMARK, DIVIDEND, DIVIDEND_YIELD, CASH,
  PERFORMANCE, PERIODS, ASSET_ALLOC, FIELDS, holdingInitial, type Holding,
} from "./data";

// Panels still backed by illustrative (non-live) data are marked via the shared
// StatTile / SectionCard `sample` prop, which renders the "data contoh" pill
// cleanly inside the component — no absolute-positioned overlay wrapper needed.
const UP = "var(--color-mk-green)";
const DOWN = "var(--color-mk-red)";

// Illustrative headline value for the DEMO user only — the real "Nilai Portofolio"
// is the live office allocation (pasar.value), which the demo never reads.
const DEMO_NILAI = "Rp 58,4 T";

// Investasi & Pasar — live holdings (features/holdings) + watchlist + allocation.
// Headline portfolio value from the office allocation SSOT ("pasar" slice).
export default function Screen() {
  const isDemo = useIsDemo();
  // Demo reads NOTHING from Convex — "skip" both queries so the anonymous demo
  // session renders purely from the in-code mock below.
  const allocs = useQuery(api.features.office.queries.listAllocations, isDemo ? "skip" : {});
  const holdings = useQuery(api.features.holdings.queries.list, isDemo ? "skip" : {});
  const [period, setPeriod] = useState("YTD");
  const [open, setOpen] = useState<Holding | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [edit, setEdit] = useState<Holding | null>(null);

  const pasar = allocs?.find((a) => a.slug === "pasar");
  const { add, edit: editFn, del } = useInvestasiWrites(holdings?.length ?? 0);

  return (
    <div className="space-y-4">
      <StatGrid>
        {!isDemo && allocs === undefined ? (
          <Skeleton className="h-[92px] w-full rounded-xl" />
        ) : (
          // Demo: illustrative value + fabricated "hari ini" delta (tagged sample).
          // Real: live pasar.value only — the fabricated delta is dropped.
          <StatTile
            label="Nilai Portofolio"
            value={isDemo ? DEMO_NILAI : pasar ? rp(pasar.value) : "—"}
            hint={isDemo ? DAY_CHANGE : undefined}
            tone={isDemo ? "up" : "flat"}
            accent
            sample={isDemo}
          />
        )}
        <StatTile label="Imbal Hasil YTD" value={isDemo ? YTD : "—"} hint={isDemo ? BENCHMARK : undefined} tone="up" sample={isDemo} />
        <StatTile label="Dividen (tahunan)" value={isDemo ? DIVIDEND : "—"} hint={isDemo ? DIVIDEND_YIELD : undefined} sample={isDemo} />
        <StatTile label="Kas Investasi" value={isDemo ? CASH : "—"} hint={isDemo ? "siap deploy" : undefined} sample={isDemo} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Kinerja Portofolio"
          sub="Indeks 100 = awal tahun"
          sample={isDemo}
          action={
            <div className="flex items-center gap-1.5">
              <PillToggleRow options={PERIODS} value={period} onChange={setPeriod} />
            </div>
          }
        >
          {isDemo ? (
            <LineChart points={PERFORMANCE} color="var(--color-mk-orange)" height={150} />
          ) : (
            <EmptyState message="Belum ada data kinerja" />
          )}
        </SectionCard>

        <SectionCard title="Alokasi Aset" sample={isDemo}>
          {isDemo ? (
            <LegendDonut segments={ASSET_ALLOC} showValue size={130} />
          ) : (
            <EmptyState message="Belum ada alokasi aset" />
          )}
        </SectionCard>
      </div>

      <HoldingsList
        rows={isDemo ? [] : (holdings ?? [])}
        loading={!isDemo && holdings === undefined}
        onAdd={() => setAddOpen(true)}
        onOpen={setOpen}
      />

      <DetailSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow={open?.sector}
        title={open?.name ?? ""}
        subtitle={open ? `${open.ticker} · bobot ${open.weight} portofolio` : undefined}
        accent={open?.up ? UP : DOWN}
        actions={
          open && (
            <>
              <Button size="sm" variant="outline" onClick={async () => { await del(open._id, open.name); setOpen(null); }}>
                Hapus
              </Button>
              <Button size="sm" onClick={() => { setEdit(open); setOpen(null); }}>
                Ubah
              </Button>
            </>
          )
        }
      >
        {open && (
          <>
            <div className="mb-3">
              <LineChart points={open.points ?? []} color={open.up ? UP : DOWN} height={96} />
            </div>
            <DataRow label="Nilai posisi" value={open.value} accent />
            <DataRow label="Perubahan hari ini" value={open.change} />
            <DataRow label="Harga rata-rata" value={open.avg} />
            <DataRow label="Jumlah" value={open.lot} />
            <DataRow label="Bobot portofolio" value={open.weight} />
          </>
        )}
      </DetailSheet>

      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Instrumen"
        subtitle="Posisi baru langsung masuk holdings portofolio"
        fields={FIELDS}
        onSubmit={add}
      />

      <FormModal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={edit ? `Ubah · ${edit.name}` : "Ubah Instrumen"}
        subtitle="Perbarui nilai, perubahan & detail posisi"
        fields={FIELDS}
        submitLabel="Perbarui"
        accent={edit?.up ? UP : DOWN}
        initial={edit ? holdingInitial(edit) : undefined}
        onSubmit={async (v) => { if (edit) await editFn(edit._id, v); }}
      />
    </div>
  );
}
