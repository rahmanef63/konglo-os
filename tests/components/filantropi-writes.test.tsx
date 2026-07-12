// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useFilantropiWrites binds three philanthropyGrants mutations (createGrant /
// updateGrant / removeGrant) to a toast + audit-log. Mock all three so we assert:
//   add()      → create called with progress Number()-coerced + cycled palette
//                color, success toast + audit log; reject → warn + rethrow.
//   disburse() → update called with { id, progress:Number, expectedVersion },
//                success toast/log; a "conflict" error → "muat ulang" warn + rethrow.
//   del()      → remove called with { id }, warn toast + audit log.
//
// `api` from _generated is `anyApi` — a proxy returning a *fresh* object per
// property read — so we discriminate mutations by getFunctionName() suffix, not
// reference identity. mockMutation() is a callable carrying .withOptimisticUpdate
// (the proven harness keeps it so any hook that registers an optimistic update
// before awaiting doesn't throw "withOptimisticUpdate is not a function").
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
  if (name.endsWith(":createGrant")) return create;
  if (name.endsWith(":updateGrant")) return update;
  if (name.endsWith(":removeGrant")) return remove;
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

import { useFilantropiWrites } from "../../frontend/slices/filantropi/writes";
import type { Id } from "../../convex/_generated/dataModel";

describe("useFilantropiWrites", () => {
  beforeEach(() => {
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  it("add() calls createGrant with Number()-coerced progress + cycled palette color, fires success toast + audit log", async () => {
    create.mockResolvedValue("grant-1");
    // count=1 → PALETTE[1 % 5] = "var(--color-mk-red)".
    const { result } = renderHook(() => useFilantropiWrites(1));

    await act(async () => {
      await result.current.add({
        name: "Beasiswa Nusantara",
        category: "Pendidikan",
        amount: "Rp 420 M",
        progress: "72",
        beneficiaries: "10.000 siswa",
        region: "34 provinsi",
        partner: "Kemendikbud",
      });
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      name: "Beasiswa Nusantara",
      category: "Pendidikan",
      amount: "Rp 420 M", // display string, passed through untouched
      progress: 72, // Number()-coerced from "72"
      color: "var(--color-mk-red)", // PALETTE[1 % 5]
      beneficiaries: "10.000 siswa",
      region: "34 provinsi",
      partner: "Kemendikbud",
    });
    expect(toast).toHaveBeenCalledWith("Program Beasiswa Nusantara ditambahkan", "success");
    expect(log).toHaveBeenCalledWith(
      "Program filantropi ditambahkan · Beasiswa Nusantara",
      "Principal",
    );
  });

  it("add() warns and rethrows when createGrant rejects (FormModal stays open)", async () => {
    create.mockRejectedValue(new Error("requireFeatureWrite"));
    const { result } = renderHook(() => useFilantropiWrites(0));

    await expect(
      result.current.add({
        name: "Program Tolak",
        category: "Kesehatan",
        amount: "Rp 1 M",
        progress: "10",
        beneficiaries: "1",
        region: "1",
        partner: "X",
      }),
    ).rejects.toThrow("requireFeatureWrite");

    expect(toast).toHaveBeenCalledWith("Gagal menyimpan — perlu akses principal", "warn");
    // no success toast on the failure path.
    expect(toast).not.toHaveBeenCalledWith(
      expect.stringContaining("ditambahkan"),
      "success",
    );
  });

  it("disburse() calls updateGrant with { id, progress:Number, expectedVersion } and fires success toast + audit log", async () => {
    update.mockResolvedValue(null);
    const { result } = renderHook(() => useFilantropiWrites(0));

    await act(async () => {
      await result.current.disburse(
        "grant-9" as Id<"philanthropyGrants">,
        "Beasiswa Nusantara",
        { progress: "85" },
        3,
      );
    });

    expect(update).toHaveBeenCalledWith({
      id: "grant-9",
      progress: 85, // Number()-coerced
      expectedVersion: 3,
    });
    expect(toast).toHaveBeenCalledWith(
      "Pencairan Beasiswa Nusantara disetujui · 85%",
      "success",
    );
    expect(log).toHaveBeenCalledWith(
      "Pencairan filantropi disetujui · Beasiswa Nusantara (85%)",
      "Principal",
    );
  });

  it("disburse() surfaces the conflict warn ('muat ulang') and rethrows on a conflict error", async () => {
    update.mockRejectedValue(new Error("write conflict detected"));
    const { result } = renderHook(() => useFilantropiWrites(0));

    await expect(
      result.current.disburse(
        "grant-9" as Id<"philanthropyGrants">,
        "Beasiswa Nusantara",
        { progress: "85" },
        1,
      ),
    ).rejects.toThrow("write conflict detected");

    expect(toast).toHaveBeenCalledWith("Data sudah berubah — muat ulang", "warn");
    // not the generic access-denied warn — the conflict branch was taken.
    expect(toast).not.toHaveBeenCalledWith(
      "Gagal menyimpan — perlu akses principal",
      "warn",
    );
  });

  it("del() calls removeGrant with { id }, fires a warn toast + audit log", async () => {
    remove.mockResolvedValue(null);
    const { result } = renderHook(() => useFilantropiWrites(0));

    await act(async () => {
      await result.current.del("grant-7" as Id<"philanthropyGrants">, "Program Lama");
    });

    expect(remove).toHaveBeenCalledWith({ id: "grant-7" });
    expect(toast).toHaveBeenCalledWith("Program Program Lama dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Program filantropi dihapus · Program Lama");
  });
});
