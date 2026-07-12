// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useInvestasiWrites binds holdings create/update/remove to a toast + audit log.
// The only non-trivial transform is `up: v.up === "Naik"` (string select →
// boolean), plus add() injects DEFAULT_POINTS for `points` and cycles PALETTE
// for `color` via count % PALETTE.length. There is NO money scaling, NO clamp,
// and NO client-side validation guard here — args are pre-formatted display
// strings passed verbatim. We assert: add()/edit() call their mutation with the
// correctly transformed args + the success toast + audit log; a rejecting
// mutation surfaces the warn toast AND rethrows (FormModal stays open); del()
// calls remove({ id }) + the warn toast + audit log.
//
// `api` from _generated is `anyApi` — a proxy returning a fresh object per read,
// so we discriminate mutations by getFunctionName() ("features/holdings/
// mutations:create"), not reference identity.

// Real ReactMutation is a callable carrying a chainable `.withOptimisticUpdate`.
// This hook does not use it, but mirroring the proven harness keeps the mock
// shape correct regardless.
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
  if (name.endsWith(":create")) return create;
  if (name.endsWith(":update")) return update;
  if (name.endsWith(":remove")) return remove;
  return mockMutation();
});
vi.mock("convex/react", () => ({ useMutation: (r: unknown) => useMutation(r) }));

const toast = vi.fn();
const log = vi.fn();
vi.mock("../../frontend/shared", () => ({
  useToast: () => toast,
  useActivityLog: () => log,
}));

import { useInvestasiWrites } from "../../frontend/slices/investasi-pasar/writes";
import { PALETTE, DEFAULT_POINTS } from "../../frontend/slices/investasi-pasar/data";
import type { Id } from "../../convex/_generated/dataModel";

describe("useInvestasiWrites", () => {
  beforeEach(() => {
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  it("add() creates with up→boolean, DEFAULT_POINTS, palette color (count%len), success toast + log", async () => {
    create.mockResolvedValue("hold-1");
    // count=1 → PALETTE[1 % 5] = PALETTE[1] = var(--color-mk-blue)
    const { result } = renderHook(() => useInvestasiWrites(1));

    await act(async () => {
      await result.current.add({
        name: "Apple Inc.",
        ticker: "AAPL",
        sector: "Saham AS · Teknologi",
        value: "Rp 4,2 T",
        change: "+1,8%",
        up: "Naik",
        weight: "7,2%",
        avg: "Rp 2.840",
        lot: "1,48 jt lbr",
      });
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      name: "Apple Inc.",
      ticker: "AAPL",
      sector: "Saham AS · Teknologi",
      value: "Rp 4,2 T",
      change: "+1,8%",
      up: true, // "Naik" → true
      weight: "7,2%",
      avg: "Rp 2.840",
      lot: "1,48 jt lbr",
      points: DEFAULT_POINTS,
      color: PALETTE[1], // count(1) % 5
    });
    expect(toast).toHaveBeenCalledWith("Instrumen Apple Inc. ditambahkan", "success");
    expect(log).toHaveBeenCalledWith("Instrumen ditambahkan · Apple Inc.", "Investasi");
  });

  it("add() maps up:'Turun' → false and cycles palette via count % length", async () => {
    create.mockResolvedValue("hold-2");
    // count=5 → PALETTE[5 % 5] = PALETTE[0] = var(--color-mk-orange)
    const { result } = renderHook(() => useInvestasiWrites(5));

    await act(async () => {
      await result.current.add({
        name: "Bond X",
        ticker: "BND",
        sector: "Obligasi",
        value: "Rp 1 T",
        change: "-0,3%",
        up: "Turun",
        weight: "2%",
        avg: "Rp 100",
        lot: "10 lbr",
      });
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ up: false, color: PALETTE[0] }),
    );
  });

  it("add() warns and rethrows when create rejects (form stays open)", async () => {
    create.mockRejectedValue(new Error("requireFeatureWrite"));
    const { result } = renderHook(() => useInvestasiWrites(0));

    await expect(
      result.current.add({
        name: "PT Tolak",
        ticker: "TLK",
        sector: "Saham",
        value: "Rp 1 T",
        change: "+1%",
        up: "Naik",
        weight: "1%",
        avg: "Rp 1",
        lot: "1 lbr",
      }),
    ).rejects.toThrow("requireFeatureWrite");

    expect(toast).toHaveBeenCalledWith("Gagal menyimpan — perlu akses tulis", "warn");
    expect(toast).not.toHaveBeenCalledWith(
      expect.stringContaining("ditambahkan"),
      "success",
    );
  });

  it("edit() updates with { id, up→boolean, verbatim fields } + success toast + log (no points/color)", async () => {
    update.mockResolvedValue(null);
    const { result } = renderHook(() => useInvestasiWrites(0));

    await act(async () => {
      await result.current.edit("hold-7" as Id<"holdings">, {
        name: "Apple Inc.",
        ticker: "AAPL",
        sector: "Saham AS · Teknologi",
        value: "Rp 5,0 T",
        change: "+2,1%",
        up: "Naik",
        weight: "8,0%",
        avg: "Rp 3.000",
        lot: "1,50 jt lbr",
      });
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      id: "hold-7",
      name: "Apple Inc.",
      ticker: "AAPL",
      sector: "Saham AS · Teknologi",
      value: "Rp 5,0 T",
      change: "+2,1%",
      up: true,
      weight: "8,0%",
      avg: "Rp 3.000",
      lot: "1,50 jt lbr",
    });
    // edit() does NOT inject points/color (those are create-only).
    expect(update.mock.calls[0][0]).not.toHaveProperty("points");
    expect(update.mock.calls[0][0]).not.toHaveProperty("color");
    expect(toast).toHaveBeenCalledWith("Instrumen Apple Inc. diperbarui", "success");
    expect(log).toHaveBeenCalledWith("Instrumen diperbarui · Apple Inc.", "Investasi");
  });

  it("del() calls remove({ id }) + warn toast + audit log (single-arg log)", async () => {
    remove.mockResolvedValue(null);
    const { result } = renderHook(() => useInvestasiWrites(0));

    await act(async () => {
      await result.current.del("hold-9" as Id<"holdings">, "Apple Inc.");
    });

    expect(remove).toHaveBeenCalledWith({ id: "hold-9" });
    expect(toast).toHaveBeenCalledWith("Apple Inc. dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Instrumen dihapus · Apple Inc.");
  });
});
