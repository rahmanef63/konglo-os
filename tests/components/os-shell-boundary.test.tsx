// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// OsShell's ScreenBoundary is a private class; exercise it through the real
// shell. Mock the heavy collaborators (Convex auth/role, router, nav/topbar,
// and the screen registry) so the only behaviour under test is: a throwing
// active screen degrades to the panel fallback, and "Coba lagi" recovers it.

let authed = true;
const useConvexAuth = vi.fn(() => ({ isAuthenticated: authed, isLoading: false }));
// OsShell now reads rbac.me → { role, isDemo }. Return the object so the shell
// resolves an effective principal (real user, not demo).
const useQuery = vi.fn(() => ({ role: "principal", isDemo: false }));
vi.mock("convex/react", () => ({
  useConvexAuth: () => useConvexAuth(),
  useQuery: () => useQuery(),
  // ChatProvider calls useAction; OnboardingDialog calls useMutation — keep inert.
  useAction: () => vi.fn(() => Promise.resolve({ ok: false, notice: "" })),
  useMutation: () => vi.fn(() => Promise.resolve()),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
// OsShell calls useAuthActions (signOut for the no-access state); keep it inert.
vi.mock("@convex-dev/auth/react", () => ({ useAuthActions: () => ({ signOut: vi.fn() }) }));

// Light stand-ins for the chrome so their own hooks (useAuthActions etc.)
// never run. The boundary lives between these, around <Screen />.
vi.mock("../../frontend/shared/os-nav", () => ({ OsNav: () => <nav data-testid="os-nav" /> }));
vi.mock("../../frontend/shared/os-topbar", () => ({ OsTopbar: () => <header data-testid="os-topbar" /> }));
vi.mock("../../frontend/shared/command-palette", () => ({ CommandPalette: () => null }));
vi.mock("../../frontend/shared/use-os-bootstrap", () => ({ useOsBootstrap: () => {} }));
// Onboarding modal + demo banner are unrelated to the boundary under test.
vi.mock("../../frontend/shared/onboarding-dialog", () => ({ OnboardingDialog: () => null }));
vi.mock("../../frontend/shared/demo-banner", () => ({ DemoBanner: () => null }));

// A screen whose throwing is controlled by a module-level flag: it throws while
// `shouldThrow` is true, and renders cleanly once the test flips it false right
// before pressing reset — so the boundary has a healthy child to recover to.
// (Deterministic, no async heal race.)
let shouldThrow = true;
function FlakyScreen() {
  if (shouldThrow) throw new Error("boom in screen");
  return <div data-testid="screen-ok">Konten panel</div>;
}
vi.mock("../../frontend/slices/registry", () => ({
  SCREENS: { beranda: () => <FlakyScreen /> },
}));

import { OsShell } from "../../frontend/shared/os-shell";

describe("OsShell ScreenBoundary", () => {
  beforeEach(() => {
    cleanup();
    authed = true;
    shouldThrow = true;
    useConvexAuth.mockClear();
    useQuery.mockClear();
  });

  it("renders the auth/role skeleton while loading or unauthenticated", () => {
    authed = false;
    render(<OsShell />);
    expect(screen.getByRole("status", { name: "Memuat Konglo OS" })).toBeInTheDocument();
    expect(screen.queryByText("Gagal memuat bagian ini")).not.toBeInTheDocument();
  });

  it("a throwing child screen renders the panel fallback (not a white screen)", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<OsShell />);
    expect(screen.getByText("Gagal memuat bagian ini")).toBeInTheDocument();
    expect(screen.getByText("Terjadi kesalahan pada panel ini. Coba lagi.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
    // chrome around the failed panel survives — failure is scoped to the panel.
    expect(screen.getByTestId("os-topbar")).toBeInTheDocument();
    errSpy.mockRestore();
  });

  it("the reset button clears the failure and re-renders the healed child", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<OsShell />);
    expect(screen.getByText("Gagal memuat bagian ini")).toBeInTheDocument();

    // heal the child, then reset: the boundary re-renders the now-ok screen.
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(screen.queryByText("Gagal memuat bagian ini")).not.toBeInTheDocument();
    expect(screen.getByTestId("screen-ok")).toBeInTheDocument();
    errSpy.mockRestore();
  });
});
