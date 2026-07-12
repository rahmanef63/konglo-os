"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Eyebrow, GlassCard, Skeleton, EmptyState } from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotionDatabase } from "./notion-database/components/NotionDatabase";
import {
  buildDatabase,
  docToPage,
  scalarFromValue,
  blankFromColumns,
  type StudioDoc,
  type StudioSpec,
} from "./adapter";
import { useStudioWrites } from "./writes";

// Studio Data — the REAL rr <NotionDatabase> table view driving Konglo's generic
// Convex CRUD. ajudan (CFO) + principal edit cells / add / delete inline; every
// intent fans out to the requireAdmin notiondb mutations. Rows are a live Convex
// query (the controlled host state); the adapter maps konglo's { table, columns,
// docs } SSOT onto the notion Database / Page contracts. Property/view CRUD
// callbacks are deliberately omitted — the schema is fixed server-side.
export default function Screen() {
  const specs = useQuery(api.features.notiondb.queries.tables) as StudioSpec[] | undefined;
  const [active, setActive] = useState<string | null>(null);
  const table = active ?? specs?.[0]?.table ?? null;
  const spec = specs?.find((s) => s.table === table) ?? null;
  const rows = useQuery(
    api.features.notiondb.queries.rows,
    table ? { table } : "skip",
  ) as StudioDoc[] | undefined;
  const writes = useStudioWrites(table ?? "", spec?.label ?? "");

  const db = useMemo(() => (spec ? buildDatabase(spec) : null), [spec]);
  const pages = useMemo(
    () => (spec ? (rows ?? []).map((d) => docToPage(d, spec)) : []),
    [rows, spec],
  );
  // _id → current `version`, read off the live rows query, so edit/delete can pass
  // it as the optimistic-concurrency token (the notiondb CAS rejects a stale write).
  const versions = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of rows ?? []) {
      if (typeof d.version === "number") m.set(d._id, d.version);
    }
    return m;
  }, [rows]);

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <Eyebrow>Studio Data</Eyebrow>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola seluruh basis data Konglo langsung — tabel ala Notion. Ubah sel, tambah & hapus
          baris; perubahan tersimpan ke Convex secara langsung.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(specs ?? []).map((s) => (
            <button
              key={s.table}
              onClick={() => setActive(s.table)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                s.table === table
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {specs === undefined ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : specs.length === 0 ? (
        <EmptyState message="Belum ada tabel basis data untuk dikelola." />
      ) : (
        spec &&
        db && (
          <GlassCard className="overflow-hidden p-0">
            <NotionDatabase
              db={db}
              rows={pages}
              readOnly={false}
              onRowUpdate={(rowId, propId, value) =>
                writes.edit(rowId, propId, scalarFromValue(value), versions.get(rowId))
              }
              onRowRemove={(rowId) => writes.del(rowId, versions.get(rowId))}
            />
            <div className="border-t border-border p-2.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => writes.add(blankFromColumns(spec))}
                disabled={writes.busy}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" /> Tambah baris
              </Button>
            </div>
          </GlassCard>
        )
      )}
    </div>
  );
}
