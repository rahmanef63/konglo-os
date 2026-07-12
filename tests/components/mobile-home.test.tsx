// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// MobileHome is a launcher: a chat SearchWidget that, on Enter, sends to the shared
// chat (ChatProvider → useAction) + navs to `asisten`, then the grouped feature
// accordion (feature-cards). Mock convex so ChatProvider's useAction, the @-mention
// useQuery, and SetupGuide's onboarding useQuery are all inert.
vi.mock("convex/react", () => ({
  useAction: () => vi.fn(() => Promise.resolve({ ok: false, notice: "" })),
  useQuery: () => undefined,
}));

import { MobileHome } from "../../frontend/slices/beranda/mobile-home";
import { NavProvider } from "../../frontend/shared/nav-context";
import { ChatProvider } from "../../frontend/shared/chat-context";

function renderAs(role: "principal" | "cfo" | "staf") {
  const nav = vi.fn();
  render(
    <ChatProvider>
      <NavProvider value={nav}>
        <MobileHome role={role} />
      </NavProvider>
    </ChatProvider>,
  );
  return { nav };
}

describe("MobileHome (launcher)", () => {
  it("principal: chat input hands off to asisten; no data widgets; feature accordion navigates", () => {
    const { nav } = renderAs("principal");

    // Typing + Enter in the chat SearchWidget sends and lands in the chatroom.
    // role=combobox (not textbox): the input drives the /-command + @-mention
    // listbox (aria-controls/activedescendant), the canonical editable-combobox.
    const input = screen.getByRole("combobox", { name: /Tulis pesan untuk asisten/ });
    fireEvent.change(input, { target: { value: "Halo" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(nav).toHaveBeenCalledWith("asisten");

    // Pure launcher — the old net-worth widget is gone.
    expect(screen.queryByText(/Kekayaan Bersih/)).toBeNull();

    // Feature accordion (open by default) exposes a button per role-accessible
    // feature; the accessible name = label + tag, so match by label regex.
    expect(screen.getByRole("button", { name: /Studio Data/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Kesehatan/ }));
    expect(nav).toHaveBeenCalledWith("kesehatan");
  });

  it("staf: feature accordion limited to its RBAC-accessible menu", () => {
    renderAs("staf");
    expect(screen.getByRole("button", { name: /Keamanan & Staf/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Studio Data/ })).toBeNull();
  });
});
