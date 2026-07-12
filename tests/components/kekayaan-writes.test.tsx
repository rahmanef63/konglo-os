// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useKekayaanWrites binds office.mutations.{setFigures,upsertAllocation,removeAllocation}
// to a toast + audit-log. We assert the TRANSFORMS (×1e12 Triliun scaling, accent
// trim+default, client validation guards) plus the success/warn toasts and audit
// log, and the failure path (warn + RE-THROW so FormModal stays open).
//
// `api` from _generated is `anyApi` — a proxy returning a *fresh* object per read,
// so we discriminate by getFunctionName() suffix, not reference identity.

// ReactMutation is a callable carrying `.withOptimisticUpdate` (chainable). The
// hook calls .withOptimisticUpdate on upsertAllocation + removeAllocation, so the
// mocks MUST expose it (returning the same callable) or the hook throws.
function mockMutation() {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    withOptimisticUpdate: (u: unknown) => typeof fn;
  };
  return Object.assign(fn, { withOptimisticUpdate: () => fn });
}

const setFigures = mockMutation();
const upsert = mockMutation();
const remove = mockMutation();
const useMutation = vi.fn((ref: unknown) => {
  const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
  if (name.endsWith(":setFigures")) return setFigures;
  if (name.endsWith(":upsertAllocation")) return upsert;
  if (name.endsWith(":removeAllocation")) return remove;
  return mockMutation();
});
vi.mock("convex/react", () => ({ useMutation: (r: unknown) => useMutation(r) }));

const toast = vi.fn();
const log = vi.fn();
vi.mock("../../frontend/shared", () => ({
  useToast: () => toast,
  useActivityLog: () => log,
  isConflict: (e: unknown) => e instanceof Error && /conflict/i.test(e.message),
}));

import { useKekayaanWrites } from "../../frontend/slices/kekayaan-kas/writes";

describe("useKekayaanWrites", () => {
  beforeEach(() => {
    setFigures.mockReset();
    upsert.mockReset();
    remove.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  // --- saveFigures ---------------------------------------------------------

  it("saveFigures() scales netWorth/liabilitas ×1e12, passes through change/ratio, success toast + log", async () => {
    setFigures.mockResolvedValue(null);
    const { result } = renderHook(() => useKekayaanWrites());

    await act(async () => {
      await result.current.saveFigures(
        { netWorth: "12.5", liabilitas: "3", debtRatio: "24", netWorthChange: "-2.5" },
        7,
      );
    });

    expect(setFigures).toHaveBeenCalledTimes(1);
    expect(setFigures).toHaveBeenCalledWith({
      netWorth: 12.5e12, // ×1e12 Triliun scaling
      liabilitas: 3e12, // ×1e12 Triliun scaling
      debtRatio: 24,
      netWorthChange: -2.5, // signed delta, not scaled
      expectedVersion: 7,
    });
    expect(toast).toHaveBeenCalledWith("Angka kekayaan diperbarui", "success");
    expect(log).toHaveBeenCalledWith("Kekayaan diperbarui · 12.5 T", "Principal");
  });

  it("saveFigures() rejects negative money: warn toast, throws, mutation NOT called", async () => {
    const { result } = renderHook(() => useKekayaanWrites());

    await expect(
      result.current.saveFigures(
        { netWorth: "-1", liabilitas: "3", debtRatio: "10", netWorthChange: "0" },
        undefined,
      ),
    ).rejects.toThrow("invalid money");

    expect(setFigures).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("Aset & liabilitas tidak boleh negatif", "warn");
  });

  it("saveFigures() rejects out-of-range debtRatio (>100): warn toast, throws, mutation NOT called", async () => {
    const { result } = renderHook(() => useKekayaanWrites());

    await expect(
      result.current.saveFigures(
        { netWorth: "5", liabilitas: "1", debtRatio: "150", netWorthChange: "0" },
        undefined,
      ),
    ).rejects.toThrow("invalid figure");

    expect(setFigures).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      "Perubahan/rasio utang tidak valid (rasio 0–100)",
      "warn",
    );
  });

  it("saveFigures() warns 'conflict' message when the mutation rejects with a conflict and rethrows", async () => {
    setFigures.mockRejectedValue(new Error("optimistic conflict detected"));
    const { result } = renderHook(() => useKekayaanWrites());

    await expect(
      result.current.saveFigures(
        { netWorth: "5", liabilitas: "1", debtRatio: "10", netWorthChange: "0" },
        2,
      ),
    ).rejects.toThrow("conflict");

    expect(toast).toHaveBeenCalledWith("Data sudah berubah — muat ulang", "warn");
    expect(toast).not.toHaveBeenCalledWith(expect.stringContaining("diperbarui"), "success");
  });

  // --- saveAllocation ------------------------------------------------------

  it("saveAllocation() create path (no slug): trims label-driven args, defaults blank accent, success toast + log", async () => {
    upsert.mockResolvedValue("alloc-1");
    const { result } = renderHook(() => useKekayaanWrites());

    await act(async () => {
      await result.current.saveAllocation(
        { label: "Properti", value: "5000000", accent: "" },
        undefined,
        undefined,
      );
    });

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith({
      slug: undefined,
      label: "Properti",
      value: 5000000, // Number()-coerced money
      accent: "var(--color-gold)", // blank accent → default token
      expectedVersion: undefined, // create path never forwards expectedVersion
    });
    expect(toast).toHaveBeenCalledWith("Alokasi Properti ditambahkan", "success");
    expect(log).toHaveBeenCalledWith("Alokasi ditambahkan · Properti", "Principal");
  });

  it("saveAllocation() edit path (slug present): trims accent, forwards expectedVersion, 'diperbarui' copy", async () => {
    upsert.mockResolvedValue("alloc-2");
    const { result } = renderHook(() => useKekayaanWrites());

    await act(async () => {
      await result.current.saveAllocation(
        { label: "Saham", value: "12", accent: "  var(--color-jade)  " },
        "saham",
        4,
      );
    });

    expect(upsert).toHaveBeenCalledWith({
      slug: "saham",
      label: "Saham",
      value: 12,
      accent: "var(--color-jade)", // trimmed
      expectedVersion: 4, // edit path forwards version
    });
    expect(toast).toHaveBeenCalledWith("Alokasi Saham diperbarui", "success");
    expect(log).toHaveBeenCalledWith("Alokasi diperbarui · Saham", "Principal");
  });

  it("saveAllocation() rejects negative value: warn toast, throws, mutation NOT called", async () => {
    const { result } = renderHook(() => useKekayaanWrites());

    await expect(
      result.current.saveAllocation(
        { label: "Bad", value: "-10", accent: "" },
        undefined,
        undefined,
      ),
    ).rejects.toThrow("invalid allocation value");

    expect(upsert).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("Nilai alokasi tidak boleh negatif", "warn");
  });

  it("saveAllocation() warns and rethrows when the mutation rejects (non-conflict)", async () => {
    upsert.mockRejectedValue(new Error("requireFeatureWrite"));
    const { result } = renderHook(() => useKekayaanWrites());

    await expect(
      result.current.saveAllocation(
        { label: "Tolak", value: "1", accent: "" },
        undefined,
        undefined,
      ),
    ).rejects.toThrow("requireFeatureWrite");

    expect(toast).toHaveBeenCalledWith(
      "Gagal menyimpan alokasi — perlu akses principal/cfo",
      "warn",
    );
  });

  // --- removeAllocation ----------------------------------------------------

  it("removeAllocation() calls remove with { id }, warn toast + audit log", async () => {
    remove.mockResolvedValue(null);
    const { result } = renderHook(() => useKekayaanWrites());

    await act(async () => {
      await result.current.removeAllocation("alloc-9", "Properti");
    });

    expect(remove).toHaveBeenCalledWith({ id: "alloc-9" });
    expect(toast).toHaveBeenCalledWith("Alokasi Properti dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Alokasi dihapus · Properti");
  });

  it("removeAllocation() warns and rethrows when remove rejects", async () => {
    remove.mockRejectedValue(new Error("requireFeatureWrite"));
    const { result } = renderHook(() => useKekayaanWrites());

    await expect(result.current.removeAllocation("alloc-9", "Properti")).rejects.toThrow(
      "requireFeatureWrite",
    );

    expect(toast).toHaveBeenCalledWith("Gagal menghapus — perlu akses principal/cfo", "warn");
  });
});
