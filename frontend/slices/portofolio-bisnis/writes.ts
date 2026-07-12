"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useRunWrite } from "@/frontend/shared/run-write";
import { PALETTE } from "./data";

const LIST = api.features.subsidiaries.queries.list;


// Subsidiary create/delete bound to toast + server audit log. The mutations are
// requireFeatureWrite("portofolio-bisnis") server-side; a non-admin gets the warn
// toast and the form stays open. create + delete carry an optimistic update that
// patches the `list` query so the row appears/disappears instantly; Convex rolls
// the local edit back automatically if the mutation rejects (e.g. blocked write).
export function usePortfolioWrites(count: number) {
  const create = useMutation(api.features.subsidiaries.mutations.create).withOptimisticUpdate(
    (store, args) => {
      // Deferred (runs at mutation-dispatch, not render): temp id + creationTime
      // are impure, so they live INSIDE the callback to satisfy react-compiler.
      const existing = store.getQuery(LIST) ?? [];
      // eslint-disable-next-line react-hooks/purity -- deferred to mutation dispatch, not render
      const now = Date.now();
      const tempId = `optimistic-${now}` as Id<"subsidiaries">;
      const order = existing.reduce((m, s) => Math.max(m, s.order), 0) + 1;
      const optimistic: Doc<"subsidiaries"> = {
        _id: tempId,
        _creationTime: now,
        name: args.name,
        sector: args.sector,
        revenue: args.revenue,
        margin: args.margin,
        ownership: args.ownership,
        trend: args.trend,
        color: args.color,
        slug: `optimistic-${now}`,
        order,
        version: 1,
      };
      store.setQuery(LIST, {}, [...existing, optimistic]);
    },
  );
  const update = useMutation(api.features.subsidiaries.mutations.update);
  const remove = useMutation(api.features.subsidiaries.mutations.remove).withOptimisticUpdate(
    (store, args) => {
      const existing = store.getQuery(LIST);
      if (!existing) return;
      store.setQuery(LIST, {}, existing.filter((s) => s._id !== args.id));
    },
  );
  const run = useRunWrite();

  const add = (v: Record<string, string>) =>
    run({
      call: () =>
        create({
          name: v.name,
          sector: v.sector,
          revenue: Number(v.revenue) * 1e12,
          margin: Number(v.margin),
          ownership: Number(v.ownership),
          trend: 0,
          color: PALETTE[count % PALETTE.length],
        }),
      ok: `Anak usaha ${v.name} ditambahkan`,
      log: [`Anak usaha ditambahkan · ${v.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses admin",
    });

  // expectedVersion = the doc's current version held by the open edit form. A
  // stale-write conflict gets a distinct "muat ulang" warn (still rethrown so the
  // FormModal keeps the form open); any other failure is the generic access warn.
  const edit = (
    id: Id<"subsidiaries">,
    v: Record<string, string>,
    expectedVersion?: number,
  ) =>
    run({
      call: () =>
        update({
          id,
          name: v.name,
          sector: v.sector,
          revenue: Number(v.revenue) * 1e12,
          margin: Number(v.margin),
          ownership: Number(v.ownership),
          expectedVersion,
        }),
      ok: `Anak usaha ${v.name} diperbarui`,
      log: [`Anak usaha diperbarui · ${v.name}`, "Principal"],
      warn: "Gagal menyimpan — perlu akses admin",
      conflict: true,
    });

  const del = (id: Id<"subsidiaries">, name: string) =>
    run({
      call: () => remove({ id }),
      ok: `${name} dihapus`,
      okTone: "warn",
      log: [`Anak usaha dihapus · ${name}`],
      warn: "Gagal menghapus — perlu akses admin",
    });

  return { add, edit, del };
}
