// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// OsDock now reads useIsDemo() (→ useQuery api.rbac.me) to hide system slices in
// demo. Stub convex/react so the query is inert (undefined → isDemo=false → normal
// RBAC). Must be declared before importing OsDock.
vi.mock("convex/react", () => ({ useQuery: () => undefined }));

import { OsDock } from "../../frontend/shared/os-dock";

// OsDock is role-props + a demo check. Five fixed slots:
// up to 3 role tabs + a raised center "Asisten AI" chat FAB + a "Menu" slot that
// opens the drawer. Tabs come from the SAME RBAC-filtered MENU as the sidebar.
function setup(role: Parameters<typeof OsDock>[0]["role"], active = "beranda") {
  const onSelect = vi.fn();
  const onOpenMenu = vi.fn();
  render(
    <OsDock role={role} active={active} onSelect={onSelect} onOpenMenu={onOpenMenu} />,
  );
  return { onSelect, onOpenMenu };
}

describe("OsDock", () => {
  beforeEach(cleanup);

  it("shows the first 3 role tabs + center Asisten + Menu (principal)", () => {
    setup("principal");
    expect(screen.getByRole("button", { name: "Beranda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Portofolio Bisnis" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kekayaan & Kas" })).toBeInTheDocument();
    // Center action = the Asisten AI chat (the app's main action).
    expect(screen.getByRole("button", { name: "Asisten AI" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    // Feature #4+ (Investasi Pasar, Filantropi…) live behind the Menu drawer.
    expect(screen.queryByRole("button", { name: "Investasi Pasar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Filantropi" })).not.toBeInTheDocument();
  });

  it("only renders role-permitted tabs (staf = Beranda + Keamanan + Asisten + Menu)", () => {
    setup("staf");
    expect(screen.getByRole("button", { name: "Beranda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keamanan & Staf" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Asisten AI" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Portofolio Bisnis" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Studio Data" })).not.toBeInTheDocument();
  });

  it("clicking a tab selects its slug (and never opens the menu)", () => {
    const { onSelect, onOpenMenu } = setup("principal");
    fireEvent.click(screen.getByRole("button", { name: "Portofolio Bisnis" }));
    expect(onSelect).toHaveBeenCalledWith("portofolio-bisnis");
    expect(onOpenMenu).not.toHaveBeenCalled();
  });

  it("the center FAB opens the Asisten chat", () => {
    const { onSelect, onOpenMenu } = setup("principal");
    fireEvent.click(screen.getByRole("button", { name: "Asisten AI" }));
    expect(onSelect).toHaveBeenCalledWith("asisten");
    expect(onOpenMenu).not.toHaveBeenCalled();
  });

  it("the Menu slot opens the drawer and never calls onSelect", () => {
    const { onSelect, onOpenMenu } = setup("principal");
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(onOpenMenu).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("marks the active tab with aria-current=page", () => {
    setup("principal", "kekayaan-kas");
    expect(screen.getByRole("button", { name: "Kekayaan & Kas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Beranda" })).not.toHaveAttribute("aria-current");
  });

  it("marks the Asisten FAB active when the chat is open", () => {
    setup("principal", "asisten");
    expect(screen.getByRole("button", { name: "Asisten AI" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Menu" })).not.toHaveAttribute("aria-current");
  });

  it("highlights Menu when the active slice lives in the drawer overflow", () => {
    // filantropi is a principal feature past the 3 dock tabs (and not asisten).
    setup("principal", "filantropi");
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Beranda" })).not.toHaveAttribute("aria-current");
  });
});
