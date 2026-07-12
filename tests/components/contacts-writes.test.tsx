// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useContactWrites binds create/update/remove (api.features.contacts.mutations)
// to a toast + audit-log. The hook does NO numeric scaling — it passes name/role/
// tier straight through and only defaults warmth → "Netral" and last → "baru saja"
// when the form field is empty. We assert those defaults precisely, the success
// toast + audit log() text, and the failure path (warn toast + RE-THROW so
// FormModal stays open).
//
// `api` from _generated is `anyApi` — a proxy returning a *fresh* object per
// property read, so we discriminate mutations by getFunctionName() (stable
// "features/contacts/mutations:create" path), not reference identity.

// The real ReactMutation is a *callable* carrying `.withOptimisticUpdate`. The
// contacts hook doesn't use it today, but we mirror the proven harness exactly
// so the mock is future-proof and never throws "is not a function".
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

import { useContactWrites } from "../../frontend/slices/relasi-jaringan/writes";
import type { Id } from "../../convex/_generated/dataModel";

describe("useContactWrites", () => {
  beforeEach(() => {
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    toast.mockReset();
    log.mockReset();
  });

  it("add() passes fields through, defaults warmth/last, and fires success toast + log", async () => {
    create.mockResolvedValue("contact-1");
    const { result } = renderHook(() => useContactWrites());

    await act(async () => {
      await result.current.add({
        name: "Pak Budi",
        role: "Notaris",
        tier: "Inner",
        warmth: "", // empty → default "Netral"
        last: "", // empty → default "baru saja"
      });
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      name: "Pak Budi",
      role: "Notaris",
      tier: "Inner",
      warmth: "Netral", // empty defaulted
      last: "baru saja", // empty defaulted
    });
    expect(toast).toHaveBeenCalledWith("Kontak Pak Budi ditambahkan", "success");
    expect(log).toHaveBeenCalledWith("Kontak ditambahkan · Pak Budi", "Principal");
  });

  it("add() keeps explicit warmth/last instead of defaulting them", async () => {
    create.mockResolvedValue("contact-2");
    const { result } = renderHook(() => useContactWrites());

    await act(async () => {
      await result.current.add({
        name: "Bu Sari",
        role: "Banker",
        tier: "Strategic",
        warmth: "Hangat",
        last: "2 hari lalu",
      });
    });

    expect(create).toHaveBeenCalledWith({
      name: "Bu Sari",
      role: "Banker",
      tier: "Strategic",
      warmth: "Hangat",
      last: "2 hari lalu",
    });
  });

  it("edit() calls update with the id + defaulted fields and fires success toast + log", async () => {
    update.mockResolvedValue(null);
    const { result } = renderHook(() => useContactWrites());

    await act(async () => {
      await result.current.edit("contact-7" as Id<"contacts">, {
        name: "Pak Budi",
        role: "Notaris Senior",
        tier: "Inner",
        warmth: "",
        last: "",
      });
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      id: "contact-7",
      name: "Pak Budi",
      role: "Notaris Senior",
      tier: "Inner",
      warmth: "Netral",
      last: "baru saja",
    });
    expect(toast).toHaveBeenCalledWith("Kontak Pak Budi diperbarui", "success");
    expect(log).toHaveBeenCalledWith("Kontak diperbarui · Pak Budi", "Principal");
  });

  it("add() warns and rethrows when the mutation rejects (form stays open)", async () => {
    create.mockRejectedValue(new Error("requireAdmin"));
    const { result } = renderHook(() => useContactWrites());

    await expect(
      result.current.add({
        name: "Kontak Tolak",
        role: "X",
        tier: "Outer",
        warmth: "",
        last: "",
      }),
    ).rejects.toThrow("requireAdmin");

    expect(toast).toHaveBeenCalledWith("Gagal menyimpan — perlu akses admin", "warn");
    // no success toast on the failure path.
    expect(toast).not.toHaveBeenCalledWith(
      expect.stringContaining("ditambahkan"),
      "success",
    );
  });

  it("del() calls remove with { id } and fires a warn toast + audit log", async () => {
    remove.mockResolvedValue(null);
    const { result } = renderHook(() => useContactWrites());

    await act(async () => {
      await result.current.del("contact-9" as Id<"contacts">, "Pak Lama");
    });

    expect(remove).toHaveBeenCalledWith({ id: "contact-9" });
    expect(toast).toHaveBeenCalledWith("Pak Lama dihapus", "warn");
    expect(log).toHaveBeenCalledWith("Kontak dihapus · Pak Lama");
  });
});
