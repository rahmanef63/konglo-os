// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useSecurityWrites binds six keamanan-staf mutations to a toast + audit log:
// createStaff/updateStaff/removeStaff + createZone/updateZone/removeZone. There's
// no client-side transform (no scaling/clamp) and no validation — args are plain
// passthrough — so the load-bearing logic is: correct args forwarded, success vs
// warn toast text, audit log() text, and the failure path (warn toast + RE-THROW
// so FormModal stays open).
//
// `api` from _generated is `anyApi` — a proxy returning a *fresh* object per read,
// so we discriminate by getFunctionName() (stable ":<mutationName>" suffix), not
// reference identity. The real ReactMutation is a callable that also carries
// `.withOptimisticUpdate`; the mocks expose it (returning the same callable) so a
// hook that chains it won't throw, and the awaited resolve/reject drives assertions.
function mockMutation() {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    withOptimisticUpdate: (u: unknown) => typeof fn;
  };
  return Object.assign(fn, { withOptimisticUpdate: () => fn });
}

const createStaff = mockMutation();
const updateStaff = mockMutation();
const removeStaff = mockMutation();
const createZone = mockMutation();
const updateZone = mockMutation();
const removeZone = mockMutation();

const useMutation = vi.fn((ref: unknown) => {
  const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
  if (name.endsWith(":createStaff")) return createStaff;
  if (name.endsWith(":updateStaff")) return updateStaff;
  if (name.endsWith(":removeStaff")) return removeStaff;
  if (name.endsWith(":createZone")) return createZone;
  if (name.endsWith(":updateZone")) return updateZone;
  if (name.endsWith(":removeZone")) return removeZone;
  return mockMutation();
});
vi.mock("convex/react", () => ({ useMutation: (r: unknown) => useMutation(r) }));

const toast = vi.fn();
const log = vi.fn();
vi.mock("../../frontend/shared", () => ({
  useToast: () => toast,
  useActivityLog: () => log,
}));

import { useSecurityWrites } from "../../frontend/slices/keamanan-staf/writes";
import type { Id } from "../../convex/_generated/dataModel";

const staffInput = {
  name: "Budi",
  role: "Pengawal",
  status: "aktif",
  color: "emerald",
  location: "Jakarta",
  shift: "Pagi",
  tenure: "3 tahun",
};
const staffArgs = {
  name: "Budi",
  role: "Pengawal",
  status: "aktif",
  color: "emerald",
  location: "Jakarta",
  shift: "Pagi",
  tenure: "3 tahun",
};

describe("useSecurityWrites", () => {
  beforeEach(() => {
    createStaff.mockReset();
    updateStaff.mockReset();
    removeStaff.mockReset();
    createZone.mockReset();
    updateZone.mockReset();
    removeZone.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  // --- staffRoster ---------------------------------------------------------
  it("addStaff() forwards every field, fires success toast + Principal log", async () => {
    createStaff.mockResolvedValue("staff-1");
    const { result } = renderHook(() => useSecurityWrites());

    await act(async () => {
      await result.current.addStaff(staffInput);
    });

    expect(createStaff).toHaveBeenCalledTimes(1);
    expect(createStaff).toHaveBeenCalledWith(staffArgs);
    expect(toast).toHaveBeenCalledWith("Staf Budi ditambahkan", "success");
    expect(log).toHaveBeenCalledWith("Staf ditambahkan · Budi", "Principal");
  });

  it("editStaff() forwards id + every field, fires success toast + Principal log", async () => {
    updateStaff.mockResolvedValue(null);
    const { result } = renderHook(() => useSecurityWrites());

    await act(async () => {
      await result.current.editStaff("staff-7" as Id<"staffRoster">, staffInput);
    });

    expect(updateStaff).toHaveBeenCalledTimes(1);
    expect(updateStaff).toHaveBeenCalledWith({ id: "staff-7", ...staffArgs });
    expect(toast).toHaveBeenCalledWith("Staf Budi diperbarui", "success");
    expect(log).toHaveBeenCalledWith("Staf diperbarui · Budi", "Principal");
  });

  it("delStaff() calls removeStaff with { id }, warn toast + log", async () => {
    removeStaff.mockResolvedValue(null);
    const { result } = renderHook(() => useSecurityWrites());

    await act(async () => {
      await result.current.delStaff("staff-9" as Id<"staffRoster">, "Budi");
    });

    expect(removeStaff).toHaveBeenCalledWith({ id: "staff-9" });
    expect(toast).toHaveBeenCalledWith("Budi dihapus dari roster", "warn");
    expect(log).toHaveBeenCalledWith("Staf dihapus · Budi");
  });

  it("addStaff() warns and rethrows when the mutation rejects (form stays open)", async () => {
    createStaff.mockRejectedValue(new Error("Forbidden"));
    const { result } = renderHook(() => useSecurityWrites());

    await expect(result.current.addStaff(staffInput)).rejects.toThrow("Forbidden");

    expect(toast).toHaveBeenCalledWith(
      "Gagal menyimpan — perlu akses principal",
      "warn",
    );
    expect(toast).not.toHaveBeenCalledWith(
      expect.stringContaining("ditambahkan"),
      "success",
    );
    expect(log).not.toHaveBeenCalled();
  });

  // --- securityZones -------------------------------------------------------
  it("addZone() forwards label/status/color, fires success toast + Principal log", async () => {
    createZone.mockResolvedValue("zone-1");
    const { result } = renderHook(() => useSecurityWrites());

    await act(async () => {
      await result.current.addZone({
        label: "Gerbang Utama",
        status: "aman",
        color: "emerald",
      });
    });

    expect(createZone).toHaveBeenCalledTimes(1);
    expect(createZone).toHaveBeenCalledWith({
      label: "Gerbang Utama",
      status: "aman",
      color: "emerald",
    });
    expect(toast).toHaveBeenCalledWith("Zona Gerbang Utama ditambahkan", "success");
    expect(log).toHaveBeenCalledWith(
      "Zona keamanan ditambahkan · Gerbang Utama",
      "Principal",
    );
  });

  it("editZone() forwards id + label/status/color, fires success toast + Principal log", async () => {
    updateZone.mockResolvedValue(null);
    const { result } = renderHook(() => useSecurityWrites());

    await act(async () => {
      await result.current.editZone("zone-3" as Id<"securityZones">, {
        label: "Gerbang Belakang",
        status: "siaga",
        color: "amber",
      });
    });

    expect(updateZone).toHaveBeenCalledTimes(1);
    expect(updateZone).toHaveBeenCalledWith({
      id: "zone-3",
      label: "Gerbang Belakang",
      status: "siaga",
      color: "amber",
    });
    expect(toast).toHaveBeenCalledWith("Zona Gerbang Belakang diperbarui", "success");
    expect(log).toHaveBeenCalledWith(
      "Zona keamanan diperbarui · Gerbang Belakang",
      "Principal",
    );
  });

  it("delZone() calls removeZone with { id }, warn toast + log", async () => {
    removeZone.mockResolvedValue(null);
    const { result } = renderHook(() => useSecurityWrites());

    await act(async () => {
      await result.current.delZone("zone-9" as Id<"securityZones">, "Gerbang Utama");
    });

    expect(removeZone).toHaveBeenCalledWith({ id: "zone-9" });
    expect(toast).toHaveBeenCalledWith("Zona Gerbang Utama dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Zona keamanan dihapus · Gerbang Utama");
  });

  it("delZone() warns and rethrows when removeZone rejects (form stays open)", async () => {
    removeZone.mockRejectedValue(new Error("Forbidden"));
    const { result } = renderHook(() => useSecurityWrites());

    await expect(
      result.current.delZone("zone-x" as Id<"securityZones">, "Gerbang Utama"),
    ).rejects.toThrow("Forbidden");

    expect(toast).toHaveBeenCalledWith(
      "Gagal menghapus — perlu akses principal",
      "warn",
    );
    expect(log).not.toHaveBeenCalled();
  });
});
