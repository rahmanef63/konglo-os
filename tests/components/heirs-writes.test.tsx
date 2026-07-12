// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useHeirWrites binds the requirePrincipal-only heir mutations to a toast +
// audit log. We mock convex/react + @/frontend/shared and assert: add()/edit()
// transform the raw form record (trim + readiness clamp/round 0–100 + "—"
// defaults) before calling create/update, fire the success toast + log, and
// rethrow on reject (so FormModal stays open). del() calls remove({ id }) with a
// warn toast + log.
//
// `api` from _generated is `anyApi` — a proxy returning a *fresh* object per
// property read, so we discriminate mutations by getFunctionName() (stable
// "features/family/mutations:createHeir" path), not reference identity.

// The real ReactMutation is a *callable* that also carries `.withOptimisticUpdate`.
// Even though useHeirWrites doesn't currently register one, mirror the proven
// harness so the mock is a callable carrying that chainable method — keeps the
// test resilient if optimistic updates are added later.
function mockMutation() {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    withOptimisticUpdate: (u: unknown) => typeof fn;
  };
  return Object.assign(fn, { withOptimisticUpdate: () => fn });
}

const create = mockMutation();
const update = mockMutation();
const remove = mockMutation();
const useMutation = vi.fn((ref: unknown) => {
  const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
  if (name.endsWith(":createHeir")) return create;
  if (name.endsWith(":updateHeir")) return update;
  if (name.endsWith(":removeHeir")) return remove;
  return mockMutation();
});
vi.mock("convex/react", () => ({ useMutation: (r: unknown) => useMutation(r) }));

const toast = vi.fn();
const log = vi.fn();
vi.mock("../../frontend/shared", () => ({
  useToast: () => toast,
  useActivityLog: () => log,
}));

import { useHeirWrites } from "../../frontend/slices/keluarga-warisan/writes";
import type { Id } from "../../convex/_generated/dataModel";

describe("useHeirWrites", () => {
  beforeEach(() => {
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  it("add() trims, clamps readiness, applies '—' defaults, then fires success toast + log", async () => {
    create.mockResolvedValue("heir-1");
    const { result } = renderHook(() => useHeirWrites());

    await act(async () => {
      await result.current.add({
        name: "  Andra W.  ",
        role: " Putra · CEO Energi ",
        share: " 28% ",
        readiness: "150.6", // clamp to 100
        mandate: " Energi & Tambang ",
        age: "", // empty → "—"
        next: "", // empty → "—"
        color: "", // empty → undefined
      });
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      name: "Andra W.",
      role: "Putra · CEO Energi",
      share: "28%",
      readiness: 100, // clamped 0–100
      mandate: "Energi & Tambang",
      age: "—",
      next: "—",
      color: undefined,
    });
    expect(toast).toHaveBeenCalledWith("Ahli waris Andra W. ditambahkan", "success");
    expect(log).toHaveBeenCalledWith("Ahli waris ditambahkan · Andra W.", "Principal");
  });

  it("add() rounds a fractional readiness and floors a negative to 0", async () => {
    create.mockResolvedValue("heir-2");
    const { result } = renderHook(() => useHeirWrites());

    await act(async () => {
      await result.current.add({
        name: "Bima",
        role: "Putra",
        share: "10%",
        readiness: "-5", // negative → 0
        mandate: "Properti",
        age: "30 th",
        next: "Q3",
        color: "var(--color-gold)",
      });
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ readiness: 0, age: "30 th", next: "Q3", color: "var(--color-gold)" }),
    );
  });

  it("edit() sends { id, ...transformedArgs } and fires the diperbarui toast + log", async () => {
    update.mockResolvedValue(null);
    const { result } = renderHook(() => useHeirWrites());

    await act(async () => {
      await result.current.edit("heir-9" as Id<"heirs">, {
        name: " Cahya ",
        role: " Putri ",
        share: " 15% ",
        readiness: "62.4", // round to 62
        mandate: " Filantropi ",
        age: "27 th",
        next: "Magang dewan",
        color: "var(--color-mk-purple)",
      });
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      id: "heir-9",
      name: "Cahya",
      role: "Putri",
      share: "15%",
      readiness: 62,
      mandate: "Filantropi",
      age: "27 th",
      next: "Magang dewan",
      color: "var(--color-mk-purple)",
    });
    expect(toast).toHaveBeenCalledWith("Ahli waris Cahya diperbarui", "success");
    expect(log).toHaveBeenCalledWith("Ahli waris diperbarui · Cahya", "Principal");
  });

  it("add() warns and rethrows when create rejects (form stays open)", async () => {
    create.mockRejectedValue(new Error("requirePrincipal"));
    const { result } = renderHook(() => useHeirWrites());

    await expect(
      result.current.add({
        name: "Tolak",
        role: "X",
        share: "1%",
        readiness: "10",
        mandate: "Y",
        age: "",
        next: "",
        color: "",
      }),
    ).rejects.toThrow("requirePrincipal");

    expect(toast).toHaveBeenCalledWith("Gagal menyimpan — perlu akses principal", "warn");
    // no success toast on the failure path.
    expect(toast).not.toHaveBeenCalledWith(
      expect.stringContaining("ditambahkan"),
      "success",
    );
  });

  it("del() calls remove({ id }) and fires a warn toast + audit log", async () => {
    remove.mockResolvedValue(null);
    const { result } = renderHook(() => useHeirWrites());

    await act(async () => {
      await result.current.del("heir-3" as Id<"heirs">, "Dewi");
    });

    expect(remove).toHaveBeenCalledWith({ id: "heir-3" });
    expect(toast).toHaveBeenCalledWith("Dewi dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Ahli waris dihapus · Dewi", "Principal");
  });

  it("del() warns and rethrows when remove rejects", async () => {
    remove.mockRejectedValue(new Error("requirePrincipal"));
    const { result } = renderHook(() => useHeirWrites());

    await expect(
      result.current.del("heir-4" as Id<"heirs">, "Eka"),
    ).rejects.toThrow("requirePrincipal");

    expect(toast).toHaveBeenCalledWith("Gagal menghapus — perlu akses principal", "warn");
  });
});
