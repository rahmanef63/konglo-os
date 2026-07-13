// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useConciergeWrites binds five lifestyle mutations to a toast + audit-log:
//   createReservation / updateReservation / removeReservation
//   createRequest / removeRequest
// There is NO money scaling / clamp / client-side validation here — args are a
// plain passthrough of the form values. So we assert: each add/edit forwards the
// exact args + success toast + audit log; each del calls remove with { id } +
// warn toast + log; and the failure path warns AND rethrows so FormModal stays open.
//
// `api` from _generated is `anyApi` — a proxy returning a *fresh* object per read,
// so we discriminate mutations by getFunctionName() suffix, not reference identity.

const createReservation = mockMutation();
const updateReservation = mockMutation();
const removeReservation = mockMutation();
const createRequest = mockMutation();
const removeRequest = mockMutation();

const useMutation = vi.fn((ref: unknown) => {
  const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
  if (name.endsWith(":createReservation")) return createReservation;
  if (name.endsWith(":updateReservation")) return updateReservation;
  if (name.endsWith(":removeReservation")) return removeReservation;
  if (name.endsWith(":createRequest")) return createRequest;
  if (name.endsWith(":removeRequest")) return removeRequest;
  return mockMutation();
});
vi.mock("convex/react", () => ({ useMutation: (r: unknown) => useMutation(r) }));

const toast = vi.fn();
const log = vi.fn();
vi.mock("../../frontend/shared", async () =>
  (await import("./_writes-harness")).sharedMock(() => toast, () => log),
);

import { useConciergeWrites } from "../../frontend/slices/hiburan-gaya-hidup/concierge-writes";
import type { Id } from "../../convex/_generated/dataModel";
import { mockMutation } from "./_writes-harness";

describe("useConciergeWrites", () => {
  beforeEach(() => {
    createReservation.mockReset();
    updateReservation.mockReset();
    removeReservation.mockReset();
    createRequest.mockReset();
    removeRequest.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  it("addRes() forwards { emoji, label } and fires success toast + audit log", async () => {
    createReservation.mockResolvedValue("res-1");
    const { result } = renderHook(() => useConciergeWrites());

    await act(async () => {
      await result.current.addRes({ emoji: "🛥️", label: "Yacht akhir pekan" });
    });

    expect(createReservation).toHaveBeenCalledTimes(1);
    expect(createReservation).toHaveBeenCalledWith({ emoji: "🛥️", label: "Yacht akhir pekan" });
    expect(toast).toHaveBeenCalledWith("Reservasi Yacht akhir pekan ditambahkan", "success");
    expect(log).toHaveBeenCalledWith("Reservasi konsierge ditambahkan · Yacht akhir pekan", "Principal");
  });

  it("editRes() forwards { id, emoji, label } and fires success toast + audit log", async () => {
    updateReservation.mockResolvedValue(null);
    const { result } = renderHook(() => useConciergeWrites());
    const id = "res-9" as Id<"conciergeReservations">;

    await act(async () => {
      await result.current.editRes(id, { emoji: "✈️", label: "Jet pribadi" });
    });

    expect(updateReservation).toHaveBeenCalledTimes(1);
    expect(updateReservation).toHaveBeenCalledWith({ id, emoji: "✈️", label: "Jet pribadi" });
    expect(toast).toHaveBeenCalledWith("Reservasi Jet pribadi diperbarui", "success");
    expect(log).toHaveBeenCalledWith("Reservasi konsierge diperbarui · Jet pribadi", "Principal");
  });

  it("delRes() calls removeReservation with { id } + warn toast + audit log", async () => {
    removeReservation.mockResolvedValue(null);
    const { result } = renderHook(() => useConciergeWrites());
    const id = "res-3" as Id<"conciergeReservations">;

    await act(async () => {
      await result.current.delRes(id, "Villa Bali");
    });

    expect(removeReservation).toHaveBeenCalledWith({ id });
    expect(toast).toHaveBeenCalledWith("Reservasi Villa Bali dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Reservasi konsierge dihapus · Villa Bali");
  });

  it("addReq() forwards { label } and fires success toast + audit log", async () => {
    createRequest.mockResolvedValue("req-1");
    const { result } = renderHook(() => useConciergeWrites());

    await act(async () => {
      await result.current.addReq({ label: "Meja VIP · Lokananta" });
    });

    expect(createRequest).toHaveBeenCalledTimes(1);
    expect(createRequest).toHaveBeenCalledWith({ label: "Meja VIP · Lokananta" });
    expect(toast).toHaveBeenCalledWith("Permintaan Meja VIP · Lokananta dicatat", "success");
    expect(log).toHaveBeenCalledWith("Permintaan konsierge dicatat · Meja VIP · Lokananta", "Principal");
  });

  it("delReq() calls removeRequest with { id } + warn toast + audit log", async () => {
    removeRequest.mockResolvedValue(null);
    const { result } = renderHook(() => useConciergeWrites());
    const id = "req-7" as Id<"conciergeRequests">;

    await act(async () => {
      await result.current.delReq(id, "Spa malam");
    });

    expect(removeRequest).toHaveBeenCalledWith({ id });
    expect(toast).toHaveBeenCalledWith("Permintaan Spa malam dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Permintaan konsierge dihapus · Spa malam");
  });

  it("addRes() warns and rethrows when createReservation rejects (form stays open)", async () => {
    createReservation.mockRejectedValue(new Error("requireFeatureWrite"));
    const { result } = renderHook(() => useConciergeWrites());

    await expect(
      result.current.addRes({ emoji: "🛥️", label: "Yacht tolak" }),
    ).rejects.toThrow("requireFeatureWrite");

    expect(toast).toHaveBeenCalledWith("Gagal menyimpan — perlu akses principal", "warn");
    expect(toast).not.toHaveBeenCalledWith(expect.stringContaining("ditambahkan"), "success");
    expect(log).not.toHaveBeenCalled();
  });

  it("delReq() warns and rethrows when removeRequest rejects", async () => {
    removeRequest.mockRejectedValue(new Error("requireFeatureWrite"));
    const { result } = renderHook(() => useConciergeWrites());

    await expect(
      result.current.delReq("req-x" as Id<"conciergeRequests">, "Gagal hapus"),
    ).rejects.toThrow("requireFeatureWrite");

    expect(toast).toHaveBeenCalledWith("Gagal menghapus — perlu akses principal", "warn");
    expect(log).not.toHaveBeenCalled();
  });
});
