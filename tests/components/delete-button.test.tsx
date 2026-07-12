// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DeleteButton } from "../../frontend/shared/delete-button";

// DeleteButton is the SSOT guard against the double-delete hole: the old
// callsites fired `await del()` immediately and stayed enabled during the
// round-trip, so a double-click double-deleted estate/holdings/contact records.
// We assert the three contract guarantees — confirm gates the fire, a declined
// confirm fires nothing, and the button disables while the mutation is in
// flight (so the second click can't land).

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DeleteButton", () => {
  beforeEach(cleanup);

  it("does NOT fire onConfirm when the confirm is declined", () => {
    const onConfirm = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteButton label="PT Awal" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("fires onConfirm once when the confirm is accepted", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<DeleteButton label="PT Awal" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("disables while the mutation is in flight, so a double-click can't double-delete", async () => {
    let resolve!: () => void;
    const inflight = new Promise<void>((r) => (resolve = r));
    const onConfirm = vi.fn().mockReturnValue(inflight);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<DeleteButton label="PT Awal" onConfirm={onConfirm} />);

    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    // button flips to the pending label + disabled while the promise is open.
    await waitFor(() => expect(screen.getByRole("button", { name: "Menghapus…" })).toBeDisabled());
    // a second click during the round-trip is a no-op — still one call.
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    resolve();
    await waitFor(() => expect(screen.getByRole("button", { name: "Hapus" })).not.toBeDisabled());
  });
});
