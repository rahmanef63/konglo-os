"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  StatGrid,
  StatTile,
  SectionCard,
  Pill,
  DataRow,
  DetailSheet,
  DeleteButton,
  LegendDonut,
  PinMap,
  FormModal,
  Skeleton,
  EmptyState,
  GoldButton,
  useIsDemo,
} from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { rp } from "@/lib/format";
import { safeColor } from "@/lib/safe-css";
import { usePropertiWrites } from "./writes";
import {
  ESTATE,
  COMPOSITION,
  ASSET_FIELDS,
  propInitial,
  typeColor,
  type Property,
} from "./data";

// Properti & Aset. A DEMO user (anonymous) sees the in-code illustrative mock
// (ESTATE KPI strip, COMPOSITION donut, global pin map) and never reads Convex;
// a REAL user sees only live data — the total-value KPI + gallery come from Convex
// (create/edit/delete). The mock-only panels (map, composition, ESTATE tiles)
// collapse to a neutral "Belum ada data" placeholder for a real user so the layout
// stays stable either way. Demo is read-only (add/edit/delete hidden or disabled).
export default function Screen() {
  const isDemo = useIsDemo();
  const allocs = useQuery(
    api.features.office.queries.listAllocations,
    isDemo ? "skip" : {},
  );
  const assets = useQuery(
    api.features.property.queries.list,
    isDemo ? "skip" : {},
  );
  const [open, setOpen] = useState<Property | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Property | null>(null);
  const { add, edit, del } = usePropertiWrites();
  const properti = allocs?.find((a) => a.slug === "properti");
  // Trivial real reduce available for the "Properti" tile; the fleet/occupancy
  // tiles have no live backing so they stay neutral for a real user.
  const propertyUnits = assets?.filter((a) => a.type === "Properti").length ?? 0;
  const galleryLoading = !isDemo && assets === undefined;
  const gallery = isDemo ? [] : (assets ?? []);

  // Height-stable neutral placeholder for a mock-only panel when real.
  const blank = (h: number) => (
    <div
      style={{ height: h }}
      className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
    >
      Belum ada data
    </div>
  );

  return (
    <div className="space-y-4">
      <StatGrid>
        {!isDemo && allocs === undefined ? (
          <Skeleton className="h-[92px] w-full rounded-xl" />
        ) : (
          // Total value is the office alloc SSOT for a real user; the demo mock has
          // no aggregate figure so it reads neutral. Asset count (hint) is live.
          <StatTile
            label="Total Nilai Aset"
            value={isDemo ? "—" : properti ? rp(properti.value) : "—"}
            hint={isDemo ? undefined : assets ? `${assets.length} aset terdaftar` : "memuat…"}
            accent
            sample={isDemo}
          />
        )}
        <StatTile label="Properti" value={isDemo ? `${ESTATE.propertyUnits} unit` : assets ? `${propertyUnits} unit` : "—"} hint={isDemo ? `${ESTATE.countries} negara` : undefined} sample={isDemo} />
        <StatTile label="Kendaraan Mewah" value={isDemo ? ESTATE.luxFleet : "—"} hint={isDemo ? "armada pribadi" : undefined} sample={isDemo} />
        <StatTile label="Okupansi Sewa" value={isDemo ? `${ESTATE.occupancy}%` : "—"} hint={isDemo ? `▲ ${ESTATE.occupancyQoQ}% QoQ` : undefined} tone={isDemo ? "up" : "flat"} sample={isDemo} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <SectionCard title="Peta Aset Global" sub="Sebaran properti & kendaraan" sample={isDemo}>
          {isDemo ? <PinMap pins={5} height={230} /> : blank(230)}
        </SectionCard>
        <SectionCard title="Komposisi Aset" sample={isDemo}>
          {isDemo ? (
            <LegendDonut segments={COMPOSITION} showValue size={130} />
          ) : (
            <EmptyState message="Belum ada data komposisi aset." />
          )}
          <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            📍 Ketuk kartu aset untuk detail nilai, status, & biaya pemeliharaan.
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="Galeri Aset"
        sub="Ketuk untuk detail & perawatan"
        action={<GoldButton onClick={() => setAddOpen(true)} disabled={isDemo} />}
      >
        {galleryLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[148px] w-full rounded-xl" />
            ))}
          </div>
        ) : gallery.length === 0 ? (
          <EmptyState
            message={
              isDemo
                ? "Galeri memakai registri live — kosong di mode demo."
                : "Belum ada aset. Tambahkan properti atau kendaraan pertama."
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((a) => (
              <button
                key={a._id}
                onClick={() => setOpen(a)}
                className="group overflow-hidden rounded-xl border border-border bg-muted/30 text-left transition-colors hover:bg-muted/60"
              >
                <div
                  className="relative h-24 w-full"
                  style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${safeColor(a.color) ?? "var(--card)"} 30%, var(--card)), var(--card))` }}
                >
                  <span className="absolute right-2.5 top-2.5">
                    <Pill color={a.color}>{a.type}</Pill>
                  </span>
                </div>
                <div className="space-y-0.5 p-3">
                  <div className="truncate text-sm font-medium text-foreground">{a.name}</div>
                  <div className="font-display text-lg font-bold text-foreground">{a.value}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.location}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <DetailSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow={open?.type}
        title={open?.name ?? ""}
        subtitle={open ? `${open.location} · sejak ${open.year}` : undefined}
        accent={open?.color}
        actions={
          open && (
            <>
              <DeleteButton label={open.name} onConfirm={async () => { await del(open._id, open.name); setOpen(null); }} />
              <Button size="sm" onClick={() => { setEditAsset(open); setOpen(null); }}>
                Ubah
              </Button>
            </>
          )
        }
      >
        {open && (
          <>
            <div
              className="mb-4 h-28 w-full rounded-xl border border-border"
              style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${safeColor(open.color) ?? "var(--card)"} 32%, var(--card)), var(--card))` }}
            />
            <DataRow label="Nilai taksiran" value={open.value} accent />
            <DataRow label="Status" value={open.status} />
            <DataRow label="Biaya perawatan" value={open.maint} />
            <DataRow label="Lokasi" value={open.location} />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{open.note}</p>
          </>
        )}
      </DetailSheet>

      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Aset"
        subtitle="Properti atau kendaraan baru langsung masuk registri"
        fields={ASSET_FIELDS}
        onSubmit={add}
      />

      <FormModal
        open={editAsset !== null}
        onClose={() => setEditAsset(null)}
        title={editAsset ? `Ubah · ${editAsset.name}` : "Ubah Aset"}
        subtitle="Perbarui nilai, status & catatan aset"
        fields={ASSET_FIELDS}
        submitLabel="Perbarui"
        accent={editAsset ? typeColor(editAsset.type) : undefined}
        initial={editAsset ? propInitial(editAsset) : undefined}
        onSubmit={async (v) => { if (editAsset) await edit(editAsset._id, v); }}
      />
    </div>
  );
}
