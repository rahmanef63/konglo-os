"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { useRunWrite } from "@/frontend/shared/run-write";
import type { StudioDoc } from "./adapter";

// The rows query returns a union of every studio table's doc type. Optimistic
// rows are built structurally (StudioDoc) and the array cast back to this — the
// same shape the screen feeds <NotionDatabase> via docToPage.
type RowsResult = FunctionReturnType<typeof api.features.notiondb.queries.rows>;

const ROWS = api.features.notiondb.queries.rows;


// Generic Studio Data CRUD bound to toast + audit log. Mutations are requireAdmin
// (principal + cfo/ajudan) server-side; failures surface a warn toast and the
// reactive query keeps the table in sync. Cell edits are silent on success
// (reactive); add/delete toast. `busy` guards add/delete only, so inline editing
// stays fluid. add + delete carry an optimistic update that patches the `rows`
// query for the active table so the row appears/disappears instantly; Convex
// rolls the local edit back automatically if the mutation rejects.
// edit/del thread the row's `version` as expectedVersion — the server CAS rejects
// a write against a row that changed under a stale client (notiondb mutations),
// surfaced here as the "muat ulang" warn instead of a silent clobber/drop.
export function useStudioWrites(table: string, label: string) {
  const create = useMutation(api.features.notiondb.mutations.createRow).withOptimisticUpdate(
    (store, args) => {
      const existing = store.getQuery(ROWS, { table: args.table }) as StudioDoc[] | undefined;
      if (!existing) return;
      // eslint-disable-next-line react-hooks/purity -- deferred to mutation dispatch, not render
      const now = Date.now();
      const order =
        existing.reduce((m, r) => Math.max(m, (r.order as number | undefined) ?? 0), 0) + 1;
      const optimistic: StudioDoc = {
        ...args.values,
        _id: `optimistic-${now}`,
        _creationTime: now,
        order,
        version: 1, // mirror the server seed so a follow-on edit holds a valid token
      };
      store.setQuery(ROWS, { table: args.table }, [...existing, optimistic] as unknown as RowsResult);
    },
  );
  const update = useMutation(api.features.notiondb.mutations.updateRow);
  const remove = useMutation(api.features.notiondb.mutations.deleteRow).withOptimisticUpdate(
    (store, args) => {
      const existing = store.getQuery(ROWS, { table: args.table }) as StudioDoc[] | undefined;
      if (!existing) return;
      const next = existing.filter((r) => r._id !== args.id);
      store.setQuery(ROWS, { table: args.table }, next as unknown as RowsResult);
    },
  );
  const run = useRunWrite();
  const [busy, setBusy] = useState(false);

  const add = async (values: Record<string, string | number>) => {
    setBusy(true);
    try {
      await run({
        call: () => create({ table, values }),
        ok: `Baris ${label} ditambahkan`,
        log: [`Tambah baris · ${label}`, "Studio Data"],
        warn: "Gagal menambah — perlu akses admin",
        rethrow: false,
      });
    } finally {
      setBusy(false);
    }
  };

  // expectedVersion = the row's current version as loaded into the table. A
  // concurrent edit that already bumped the version is rejected by the server CAS
  // and surfaced as the "muat ulang" warn (the live query re-syncs the table).
  const edit = async (
    id: string,
    field: string,
    value: string | number,
    expectedVersion?: number,
  ) =>
    run({
      call: () => update({ table, id, field, value, expectedVersion }),
      warn: "Gagal menyimpan perubahan",
      conflict: true,
      rethrow: false,
    });

  const del = async (id: string, expectedVersion?: number) => {
    setBusy(true);
    try {
      await run({
        call: () => remove({ table, id, expectedVersion }),
        ok: `Baris ${label} dihapus`,
        okTone: "warn",
        log: [`Hapus baris · ${label}`, "Studio Data"],
        warn: "Gagal menghapus",
        conflict: true,
        rethrow: false,
      });
    } finally {
      setBusy(false);
    }
  };

  return { busy, add, edit, del };
}
