// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useHiburanWrites binds lifestyle event mutations to a toast + audit-log.
// We assert: add() calls createEvent with the cycled PALETTE color + success
// toast; edit() calls updateEvent with { id, ...fields } + success toast; del()
// calls removeEvent with { id } + a warn toast; and a rejecting mutation fires
// the warn toast AND rethrows so FormModal keeps the form open.
//
// `api` from _generated is `anyApi` — a proxy returning a fresh object per read,
// so we discriminate mutations by getFunctionName() suffix, not reference identity.

const create = mockMutation();
const update = mockMutation();
const remove = mockMutation();
const useMutation = vi.fn((ref: unknown) => {
  const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
  if (name.endsWith(":createEvent")) return create;
  if (name.endsWith(":updateEvent")) return update;
  if (name.endsWith(":removeEvent")) return remove;
  return mockMutation();
});
vi.mock("convex/react", () => ({ useMutation: (r: unknown) => useMutation(r) }));

const toast = vi.fn();
const log = vi.fn();
vi.mock("../../frontend/shared", async () =>
  (await import("./_writes-harness")).sharedMock(() => toast, () => log),
);

import { useHiburanWrites } from "../../frontend/slices/hiburan-gaya-hidup/writes";
import type { Id } from "../../convex/_generated/dataModel";
import { mockMutation } from "./_writes-harness";

// PALETTE cycle from the SUT — index 0 must be the first color so count=0 picks it.
const PALETTE_FIRST = "var(--color-mk-purple)";
const PALETTE_THIRD = "var(--color-mk-red)";

describe("useHiburanWrites", () => {
  beforeEach(() => {
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  it("add() calls createEvent with the cycled PALETTE color + success toast + audit log", async () => {
    create.mockResolvedValue("evt-1");
    const { result } = renderHook(() => useHiburanWrites(0));

    await act(async () => {
      await result.current.add({
        title: "Gala Amal",
        date: "04 Mei",
        location: "Hotel Mulia",
      });
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      title: "Gala Amal",
      date: "04 Mei",
      location: "Hotel Mulia",
      color: PALETTE_FIRST, // PALETTE[0 % 5]
    });
    expect(toast).toHaveBeenCalledWith("Acara Gala Amal ditambahkan", "success");
    expect(log).toHaveBeenCalledWith(
      "Acara gaya hidup ditambahkan · Gala Amal",
      "Principal",
    );
  });

  it("add() cycles the PALETTE color by count % 5", async () => {
    create.mockResolvedValue("evt-2");
    const { result } = renderHook(() => useHiburanWrites(7)); // 7 % 5 === 2 → red

    await act(async () => {
      await result.current.add({ title: "X", date: "d", location: "l" });
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ color: PALETTE_THIRD }),
    );
  });

  it("edit() calls updateEvent with { id, ...fields } + success toast + audit log", async () => {
    update.mockResolvedValue(null);
    const { result } = renderHook(() => useHiburanWrites(0));

    await act(async () => {
      await result.current.edit("evt-9" as Id<"lifestyleEvents">, {
        title: "Gala Baru",
        date: "10 Jun",
        location: "Ritz",
      });
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      id: "evt-9",
      title: "Gala Baru",
      date: "10 Jun",
      location: "Ritz",
    });
    expect(toast).toHaveBeenCalledWith("Acara Gala Baru diperbarui", "success");
    expect(log).toHaveBeenCalledWith(
      "Acara gaya hidup diperbarui · Gala Baru",
      "Principal",
    );
  });

  it("del() calls removeEvent with { id } + a warn toast + audit log", async () => {
    remove.mockResolvedValue(null);
    const { result } = renderHook(() => useHiburanWrites(0));

    await act(async () => {
      await result.current.del("evt-3" as Id<"lifestyleEvents">, "Gala Lama");
    });

    expect(remove).toHaveBeenCalledWith({ id: "evt-3" });
    expect(toast).toHaveBeenCalledWith("Acara Gala Lama dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Acara gaya hidup dihapus · Gala Lama");
  });

  it("add() warns and rethrows when createEvent rejects (form stays open)", async () => {
    create.mockRejectedValue(new Error("requireFeatureWrite"));
    const { result } = renderHook(() => useHiburanWrites(0));

    await expect(
      result.current.add({ title: "PT Tolak", date: "d", location: "l" }),
    ).rejects.toThrow("requireFeatureWrite");

    expect(toast).toHaveBeenCalledWith(
      "Gagal menyimpan — perlu akses principal",
      "warn",
    );
    // no success toast on the failure path.
    expect(toast).not.toHaveBeenCalledWith(
      expect.stringContaining("ditambahkan"),
      "success",
    );
  });
});
