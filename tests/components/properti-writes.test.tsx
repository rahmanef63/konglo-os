// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// usePropertiWrites binds property create/update/remove to a toast + audit-log.
// There is NO numeric scaling/validation here (the propertyAssets columns are
// verbatim strings, e.g. "Rp 480 M"). The one real transform is the derived
// `color: typeColor(v.type)` injected into create/update — asset class → theme
// accent token, with a gold fallback for an unknown type. We assert that derived
// color precisely, plus the success toast + audit log() text, and the failure
// path (warn toast + RE-THROW so FormModal keeps the form open).
//
// `api` from _generated is `anyApi` — a proxy returning a fresh object per read —
// so mutations are discriminated by getFunctionName() (stable path), not identity.

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
vi.mock("../../frontend/shared", async () =>
  (await import("./_writes-harness")).sharedMock(() => toast, () => log),
);

import { usePropertiWrites } from "../../frontend/slices/properti-aset/writes";
import type { Id } from "../../convex/_generated/dataModel";
import { mockMutation } from "./_writes-harness";

describe("usePropertiWrites", () => {
  beforeEach(() => {
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  it("add() calls create with all fields verbatim + derived color, then success toast + log", async () => {
    create.mockResolvedValue("prop-1");
    const { result } = renderHook(() => usePropertiWrites());

    await act(async () => {
      await result.current.add({
        name: "Penthouse SCBD",
        type: "Properti",
        value: "Rp 480 M",
        location: "Jakarta",
        status: "Dihuni",
        maint: "Rp 1,2 M/bln",
        year: "2019",
        note: "Lantai 56",
      });
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      name: "Penthouse SCBD",
      type: "Properti",
      value: "Rp 480 M",
      location: "Jakarta",
      color: "var(--color-mk-red)", // typeColor("Properti")
      maint: "Rp 1,2 M/bln",
      status: "Dihuni",
      year: "2019",
      note: "Lantai 56",
    });
    expect(toast).toHaveBeenCalledWith("Aset Penthouse SCBD ditambahkan", "success");
    expect(log).toHaveBeenCalledWith("Aset ditambahkan · Penthouse SCBD", "Principal");
  });

  it("add() derives the gold fallback color for an unknown asset type", async () => {
    create.mockResolvedValue("prop-2");
    const { result } = renderHook(() => usePropertiWrites());

    await act(async () => {
      await result.current.add({
        name: "Misteri",
        type: "Tidak dikenal",
        value: "Rp 1 M",
        location: "Bali",
        status: "Disewakan",
        maint: "Rp 0",
        year: "2020",
        note: "",
      });
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "Tidak dikenal", color: "var(--color-gold)" }),
    );
  });

  it("add() warns and rethrows when create rejects (form stays open)", async () => {
    create.mockRejectedValue(new Error("requireFeatureWrite"));
    const { result } = renderHook(() => usePropertiWrites());

    await expect(
      result.current.add({
        name: "Tolak",
        type: "Properti",
        value: "Rp 1 M",
        location: "X",
        status: "Y",
        maint: "Z",
        year: "2021",
        note: "",
      }),
    ).rejects.toThrow("requireFeatureWrite");

    expect(toast).toHaveBeenCalledWith("Gagal menyimpan — perlu akses tulis", "warn");
    expect(toast).not.toHaveBeenCalledWith(
      expect.stringContaining("ditambahkan"),
      "success",
    );
  });

  it("edit() calls update with { id, ...fields, derived color } + success toast + log", async () => {
    update.mockResolvedValue(null);
    const { result } = renderHook(() => usePropertiWrites());

    await act(async () => {
      await result.current.edit("prop-7" as Id<"propertyAssets">, {
        name: "Jet G650",
        type: "Jet pribadi",
        value: "Rp 900 M",
        location: "Halim",
        status: "Aktif",
        maint: "Rp 5 M/bln",
        year: "2022",
        note: "14 kursi",
      });
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      id: "prop-7",
      name: "Jet G650",
      type: "Jet pribadi",
      value: "Rp 900 M",
      location: "Halim",
      color: "var(--color-mk-blue)", // typeColor("Jet pribadi")
      maint: "Rp 5 M/bln",
      status: "Aktif",
      year: "2022",
      note: "14 kursi",
    });
    expect(toast).toHaveBeenCalledWith("Aset Jet G650 diperbarui", "success");
    expect(log).toHaveBeenCalledWith("Aset diperbarui · Jet G650", "Principal");
  });

  it("del() calls remove with { id } + warn toast + audit log", async () => {
    remove.mockResolvedValue(null);
    const { result } = renderHook(() => usePropertiWrites());

    await act(async () => {
      await result.current.del("prop-9" as Id<"propertyAssets">, "Villa Ubud");
    });

    expect(remove).toHaveBeenCalledWith({ id: "prop-9" });
    expect(toast).toHaveBeenCalledWith("Villa Ubud dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Aset dihapus · Villa Ubud");
  });
});
