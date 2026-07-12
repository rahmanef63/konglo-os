// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// Write hooks bind a Convex mutation to a toast + audit-log. Mock all three so
// we assert: add() calls create + a success toast; a rejecting create surfaces
// the warn toast AND rethrows (so FormModal keeps the form open); del() calls
// remove + a warn toast.
//
// `api` from _generated is `anyApi` — a proxy that returns a *fresh* object per
// property read, so we discriminate mutations by getFunctionName() (stable
// "features/subsidiaries/mutations:create" path), not reference identity.

// The real ReactMutation is a *callable* that also carries `.withOptimisticUpdate`
// (chainable: it returns a mutation with the update registered). add()/del() now
// register an optimistic update before awaiting, so the mocks must expose that
// method or the hook throws "withOptimisticUpdate is not a function". We make it
// return the same callable so the awaited resolve/reject still drives the assertions.
function mockMutation() {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    withOptimisticUpdate: (u: unknown) => typeof fn;
  };
  return Object.assign(fn, { withOptimisticUpdate: () => fn });
}

const create = mockMutation();
const remove = mockMutation();
const useMutation = vi.fn((ref: unknown) => {
  const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
  if (name.endsWith(":create")) return create;
  if (name.endsWith(":remove")) return remove;
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

import { usePortfolioWrites } from "../../frontend/slices/portofolio-bisnis/writes";
import type { Id } from "../../convex/_generated/dataModel";

describe("usePortfolioWrites", () => {
  beforeEach(() => {
    create.mockReset();
    remove.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  it("add() calls the create mutation (triliun-scaled) and fires a success toast", async () => {
    create.mockResolvedValue("sub-1");
    const { result } = renderHook(() => usePortfolioWrites(0));

    await act(async () => {
      await result.current.add({
        name: "PT Baru",
        sector: "Energi",
        revenue: "4.8",
        margin: "32",
        ownership: "100",
      });
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "PT Baru",
        sector: "Energi",
        revenue: 4.8e12, // ×1e12 scaling
        margin: 32,
        ownership: 100,
        trend: 0,
      }),
    );
    expect(toast).toHaveBeenCalledWith("Anak usaha PT Baru ditambahkan", "success");
    expect(log).toHaveBeenCalledWith("Anak usaha ditambahkan · PT Baru", "Principal");
  });

  it("add() warns and rethrows when the mutation rejects (form stays open)", async () => {
    create.mockRejectedValue(new Error("requireAdmin"));
    const { result } = renderHook(() => usePortfolioWrites(0));

    await expect(
      result.current.add({
        name: "PT Tolak",
        sector: "Energi",
        revenue: "1",
        margin: "10",
        ownership: "50",
      }),
    ).rejects.toThrow("requireAdmin");

    expect(toast).toHaveBeenCalledWith("Gagal menyimpan — perlu akses admin", "warn");
    // no success toast on the failure path.
    expect(toast).not.toHaveBeenCalledWith(
      expect.stringContaining("ditambahkan"),
      "success",
    );
  });

  it("del() calls the remove mutation and fires a warn toast + audit log", async () => {
    remove.mockResolvedValue(null);
    const { result } = renderHook(() => usePortfolioWrites(0));

    await act(async () => {
      await result.current.del("sub-9" as Id<"subsidiaries">, "PT Lama");
    });

    expect(remove).toHaveBeenCalledWith({ id: "sub-9" });
    expect(toast).toHaveBeenCalledWith("PT Lama dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Anak usaha dihapus · PT Lama");
  });
});
