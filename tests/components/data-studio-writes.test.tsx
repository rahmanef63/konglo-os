// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// data-studio (Studio Data) generic CRUD binds the notiondb mutations to a toast
// + audit-log. P12-D wired the optimistic-concurrency token (expectedVersion)
// through edit/del, but the conflict path is FE-untested. These specs cover it:
// a rejecting updateRow/deleteRow whose Error message carries "conflict" must
// surface the friendly "muat ulang" warn (the live query re-syncs the table) —
// NOT the generic save/delete failure. A non-conflict reject keeps the generic
// warn. Mirrors tests/components/portfolio-writes.test.tsx's mocking pattern.
//
// `api` from _generated is `anyApi` — a proxy returning a *fresh* object per
// property read — so mutations are discriminated by getFunctionName() (stable
// "features/notiondb/mutations:updateRow" path), not reference identity.

// The real ReactMutation is a *callable* carrying `.withOptimisticUpdate`
// (chainable). createRow + deleteRow register an optimistic update before
// awaiting, so the mocks must expose that method (return the same callable) or
// the hook throws "withOptimisticUpdate is not a function".
function mockMutation() {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    withOptimisticUpdate: (u: unknown) => typeof fn;
  };
  return Object.assign(fn, { withOptimisticUpdate: () => fn });
}

const createRow = mockMutation();
const updateRow = mockMutation();
const deleteRow = mockMutation();
const useMutation = vi.fn((ref: unknown) => {
  const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
  if (name.endsWith(":createRow")) return createRow;
  if (name.endsWith(":updateRow")) return updateRow;
  if (name.endsWith(":deleteRow")) return deleteRow;
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

import { useStudioWrites } from "../../frontend/slices/data-studio/writes";

const CONFLICT = "conflict: data telah berubah";

describe("useStudioWrites — P12-D conflict path", () => {
  beforeEach(() => {
    createRow.mockReset();
    updateRow.mockReset();
    deleteRow.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  it("edit() surfaces the 'muat ulang' warn when updateRow rejects with a conflict", async () => {
    updateRow.mockRejectedValue(new Error(CONFLICT));
    const { result } = renderHook(() => useStudioWrites("contacts", "Kontak"));

    await act(async () => {
      await result.current.edit("row-1", "name", "Baru", 3);
    });

    expect(updateRow).toHaveBeenCalledWith({
      table: "contacts",
      id: "row-1",
      field: "name",
      value: "Baru",
      expectedVersion: 3,
    });
    expect(toast).toHaveBeenCalledWith("Data sudah berubah — muat ulang", "warn");
    // not the generic save-failure warn.
    expect(toast).not.toHaveBeenCalledWith("Gagal menyimpan perubahan", "warn");
  });

  it("edit() falls back to the generic warn for a non-conflict reject", async () => {
    updateRow.mockRejectedValue(new Error("requireAdmin"));
    const { result } = renderHook(() => useStudioWrites("contacts", "Kontak"));

    await act(async () => {
      await result.current.edit("row-1", "name", "Baru", 3);
    });

    expect(toast).toHaveBeenCalledWith("Gagal menyimpan perubahan", "warn");
    expect(toast).not.toHaveBeenCalledWith("Data sudah berubah — muat ulang", "warn");
  });

  it("del() surfaces the 'muat ulang' warn when deleteRow rejects with a conflict", async () => {
    deleteRow.mockRejectedValue(new Error(CONFLICT));
    const { result } = renderHook(() => useStudioWrites("contacts", "Kontak"));

    await act(async () => {
      await result.current.del("row-9", 5);
    });

    expect(deleteRow).toHaveBeenCalledWith({
      table: "contacts",
      id: "row-9",
      expectedVersion: 5,
    });
    expect(toast).toHaveBeenCalledWith("Data sudah berubah — muat ulang", "warn");
    // no audit-log on the failed delete, and not the generic delete-failure warn.
    expect(toast).not.toHaveBeenCalledWith("Gagal menghapus", "warn");
    expect(log).not.toHaveBeenCalled();
  });

  it("del() falls back to the generic warn for a non-conflict reject", async () => {
    deleteRow.mockRejectedValue(new Error("requireAdmin"));
    const { result } = renderHook(() => useStudioWrites("contacts", "Kontak"));

    await act(async () => {
      await result.current.del("row-9", 5);
    });

    expect(toast).toHaveBeenCalledWith("Gagal menghapus", "warn");
    expect(toast).not.toHaveBeenCalledWith("Data sudah berubah — muat ulang", "warn");
  });
});
