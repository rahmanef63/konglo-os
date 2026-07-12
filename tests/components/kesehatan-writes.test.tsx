// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useKesehatanWrites binds the six kesehatan mutations (medical team + schedule)
// to a toast + audit-log. We mock all three deps so we assert: add/edit call the
// mutation with the correctly transformed args (the only transform is the injected
// `color` from pickColor(count) = PALETTE[count % len]) + a success toast + log; a
// rejecting mutation surfaces a warn toast AND rethrows (FormModal stays open);
// del() calls remove({ id }) + a warn toast + log.
//
// `api` from _generated is `anyApi` — a proxy returning a fresh object per property
// read — so we discriminate mutations by getFunctionName() (stable
// "features/kesehatan/mutations:createMedicalTeam" path), not reference identity.

// The real ReactMutation is a callable that also carries `.withOptimisticUpdate`.
// Mirror that shape so the hook never throws even if a mutation registers an
// optimistic update before awaiting.
function mockMutation() {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    withOptimisticUpdate: (u: unknown) => typeof fn;
  };
  return Object.assign(fn, { withOptimisticUpdate: () => fn });
}

const createTeam = mockMutation();
const updateTeam = mockMutation();
const removeTeam = mockMutation();
const createSchedule = mockMutation();
const updateSchedule = mockMutation();
const removeSchedule = mockMutation();

const useMutation = vi.fn((ref: unknown) => {
  const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
  if (name.endsWith(":createMedicalTeam")) return createTeam;
  if (name.endsWith(":updateMedicalTeam")) return updateTeam;
  if (name.endsWith(":removeMedicalTeam")) return removeTeam;
  if (name.endsWith(":createSchedule")) return createSchedule;
  if (name.endsWith(":updateSchedule")) return updateSchedule;
  if (name.endsWith(":removeSchedule")) return removeSchedule;
  return mockMutation();
});
vi.mock("convex/react", () => ({ useMutation: (r: unknown) => useMutation(r) }));

const toast = vi.fn();
const log = vi.fn();
vi.mock("../../frontend/shared", () => ({
  useToast: () => toast,
  useActivityLog: () => log,
}));

import { useKesehatanWrites } from "../../frontend/slices/kesehatan/writes";
import type { Id } from "../../convex/_generated/dataModel";

// pickColor cycles PALETTE from frontend/slices/kesehatan/data.ts:
// [green, blue, purple, orange, gold]. teamCount=0 → green; scheduleCount=1 → blue.
const GREEN = "var(--color-mk-green)";
const BLUE = "var(--color-mk-blue)";

describe("useKesehatanWrites", () => {
  beforeEach(() => {
    [createTeam, updateTeam, removeTeam, createSchedule, updateSchedule, removeSchedule].forEach(
      (m) => m.mockReset(),
    );
    toast.mockReset();
    log.mockReset();
  });

  // --- medical team ---------------------------------------------------------

  it("addTeam() calls createMedicalTeam with pickColor(teamCount) injected + success toast + log", async () => {
    createTeam.mockResolvedValue("team-1");
    const { result } = renderHook(() => useKesehatanWrites(0, 0));

    await act(async () => {
      await result.current.addTeam({ name: "dr. Sari", role: "Dokter keluarga" });
    });

    expect(createTeam).toHaveBeenCalledTimes(1);
    expect(createTeam).toHaveBeenCalledWith({
      name: "dr. Sari",
      role: "Dokter keluarga",
      color: GREEN, // PALETTE[0 % 5]
    });
    expect(toast).toHaveBeenCalledWith("dr. Sari ditambahkan ke tim medis", "success");
    expect(log).toHaveBeenCalledWith("Tim medis ditambahkan · dr. Sari", "Principal");
  });

  it("editTeam() calls updateMedicalTeam with { id, name, role } (no color) + success toast + log", async () => {
    updateTeam.mockResolvedValue(null);
    const { result } = renderHook(() => useKesehatanWrites(3, 0));

    await act(async () => {
      await result.current.editTeam("team-9" as Id<"healthMedicalTeam">, {
        name: "dr. Budi",
        role: "Kardiolog",
      });
    });

    expect(updateTeam).toHaveBeenCalledWith({
      id: "team-9",
      name: "dr. Budi",
      role: "Kardiolog",
    });
    expect(toast).toHaveBeenCalledWith("dr. Budi diperbarui", "success");
    expect(log).toHaveBeenCalledWith("Tim medis diperbarui · dr. Budi", "Principal");
  });

  it("addTeam() warns and rethrows when createMedicalTeam rejects (form stays open)", async () => {
    createTeam.mockRejectedValue(new Error("Forbidden"));
    const { result } = renderHook(() => useKesehatanWrites(0, 0));

    await expect(
      result.current.addTeam({ name: "dr. Tolak", role: "Umum" }),
    ).rejects.toThrow("Forbidden");

    expect(toast).toHaveBeenCalledWith("Gagal menyimpan — perlu akses principal", "warn");
    expect(toast).not.toHaveBeenCalledWith(expect.stringContaining("ditambahkan"), "success");
  });

  it("delTeam() calls removeMedicalTeam with { id } + warn toast + log", async () => {
    removeTeam.mockResolvedValue(null);
    const { result } = renderHook(() => useKesehatanWrites(0, 0));

    await act(async () => {
      await result.current.delTeam("team-5" as Id<"healthMedicalTeam">, "dr. Lama");
    });

    expect(removeTeam).toHaveBeenCalledWith({ id: "team-5" });
    expect(toast).toHaveBeenCalledWith("dr. Lama dihapus dari tim medis", "warn");
    expect(log).toHaveBeenCalledWith("Tim medis dihapus · dr. Lama", "Principal");
  });

  // --- schedule -------------------------------------------------------------

  it("addSchedule() calls createSchedule with pickColor(scheduleCount) injected + success toast + log", async () => {
    createSchedule.mockResolvedValue("sched-1");
    const { result } = renderHook(() => useKesehatanWrites(0, 1));

    await act(async () => {
      await result.current.addSchedule({
        date: "18 Jun",
        title: "Cek lab tahunan",
        location: "Klinik Konsierge",
      });
    });

    expect(createSchedule).toHaveBeenCalledTimes(1);
    expect(createSchedule).toHaveBeenCalledWith({
      date: "18 Jun",
      title: "Cek lab tahunan",
      location: "Klinik Konsierge",
      color: BLUE, // PALETTE[1 % 5]
    });
    expect(toast).toHaveBeenCalledWith('Janji "Cek lab tahunan" ditambahkan', "success");
    expect(log).toHaveBeenCalledWith("Jadwal kesehatan ditambahkan · Cek lab tahunan", "Principal");
  });

  it("editSchedule() calls updateSchedule with { id, date, title, location } (no color) + success toast + log", async () => {
    updateSchedule.mockResolvedValue(null);
    const { result } = renderHook(() => useKesehatanWrites(0, 0));

    await act(async () => {
      await result.current.editSchedule("sched-7" as Id<"healthSchedule">, {
        date: "20 Jul",
        title: "Vaksin booster",
        location: "RS Pusat",
      });
    });

    expect(updateSchedule).toHaveBeenCalledWith({
      id: "sched-7",
      date: "20 Jul",
      title: "Vaksin booster",
      location: "RS Pusat",
    });
    expect(toast).toHaveBeenCalledWith('Janji "Vaksin booster" diperbarui', "success");
    expect(log).toHaveBeenCalledWith("Jadwal kesehatan diperbarui · Vaksin booster", "Principal");
  });

  it("delSchedule() calls removeSchedule with { id } + warn toast + log", async () => {
    removeSchedule.mockResolvedValue(null);
    const { result } = renderHook(() => useKesehatanWrites(0, 0));

    await act(async () => {
      await result.current.delSchedule("sched-3" as Id<"healthSchedule">, "Sesi lama");
    });

    expect(removeSchedule).toHaveBeenCalledWith({ id: "sched-3" });
    expect(toast).toHaveBeenCalledWith('Janji "Sesi lama" dihapus', "warn");
    expect(log).toHaveBeenCalledWith("Jadwal kesehatan dihapus · Sesi lama", "Principal");
  });

  it("delSchedule() warns with WARN_DEL and rethrows when removeSchedule rejects", async () => {
    removeSchedule.mockRejectedValue(new Error("Forbidden"));
    const { result } = renderHook(() => useKesehatanWrites(0, 0));

    await expect(
      result.current.delSchedule("sched-x" as Id<"healthSchedule">, "X"),
    ).rejects.toThrow("Forbidden");

    expect(toast).toHaveBeenCalledWith("Gagal menghapus — perlu akses principal", "warn");
  });
});
