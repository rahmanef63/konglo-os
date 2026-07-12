// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import "@testing-library/jest-dom/vitest";

// useQuery feeds the live "Anak Usaha" + "Kontak" groups; stub it so the
// palette renders deterministically without a Convex client. The component
// calls useQuery twice PER render (subs, contacts), so we discriminate by the
// query's getFunctionName (NOT call order — React re-renders several times and
// `mockReturnValueOnce` would run dry). createPortal is stubbed to render
// inline so jsdom queries can see the dialog.
let SUBS_DATA: unknown;
let CONTACTS_DATA: unknown;
const useQuery = vi.fn((ref: unknown) => {
  const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
  if (name.startsWith("features/subsidiaries")) return SUBS_DATA;
  if (name.startsWith("features/contacts")) return CONTACTS_DATA;
  return undefined;
});
vi.mock("convex/react", () => ({ useQuery: (r: unknown) => useQuery(r) }));
vi.mock("react-dom", async (orig) => {
  const actual = await orig<typeof import("react-dom")>();
  return { ...actual, createPortal: (node: React.ReactNode) => node };
});

import { CommandPalette } from "../../frontend/shared/command-palette";

const SUBS = [
  { slug: "energi", name: "PT Energi Nusantara", sector: "Energi", revenue: 4.8e12, color: "var(--color-mk-blue)" },
];
const CONTACTS = [
  { slug: "menteri", name: "Pak Menteri", role: "Regulator", tier: "VIP" },
];

function primeQueries(subs: unknown = SUBS, contacts: unknown = CONTACTS) {
  SUBS_DATA = subs;
  CONTACTS_DATA = contacts;
}

function open(role: Parameters<typeof CommandPalette>[0]["role"] = "principal") {
  const onNavigate = vi.fn();
  const onClose = vi.fn();
  render(
    <CommandPalette open onClose={onClose} onNavigate={onNavigate} role={role} />,
  );
  return { onNavigate, onClose };
}

describe("CommandPalette", () => {
  beforeEach(() => {
    cleanup();
    primeQueries();
  });

  it("lists feature, subsidiary and contact entries with no query", () => {
    open("principal");
    expect(screen.getByRole("option", { name: /Beranda/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /PT Energi Nusantara/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Pak Menteri/ })).toBeInTheDocument();
  });

  it("filters entries by the typed query (case-insensitive, matches label/sub/tag)", () => {
    open("principal");
    // "portofolio" appears only in the Portofolio Bisnis label across the menu.
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "PORTOFOLIO" } });
    const list = screen.getByRole("listbox");
    expect(within(list).getByRole("option", { name: /Portofolio Bisnis/ })).toBeInTheDocument();
    expect(within(list).queryByRole("option", { name: /Beranda/ })).not.toBeInTheDocument();
    expect(within(list).queryByRole("option", { name: /Kekayaan & Kas/ })).not.toBeInTheDocument();
    expect(within(list).queryByRole("option", { name: /Pak Menteri/ })).not.toBeInTheDocument();
  });

  it("matches a feature by its subtitle text, not just the label", () => {
    open("principal");
    // Beranda's subtitle is "Ringkasan kekayaan & sinyal hari ini".
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "sinyal hari ini" } });
    const list = screen.getByRole("listbox");
    expect(within(list).getByRole("option", { name: /Beranda/ })).toBeInTheDocument();
    expect(within(list).queryByRole("option", { name: /Portofolio Bisnis/ })).not.toBeInTheDocument();
  });

  it("shows the empty state when nothing matches", () => {
    open("principal");
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "zzz-no-such-thing" },
    });
    expect(screen.getByText("Tidak ada hasil.")).toBeInTheDocument();
  });

  it("only shows role-permitted feature entries (staf cannot see Portofolio)", () => {
    open("staf");
    const list = screen.getByRole("listbox");
    // staf menu = beranda + keamanan-staf only.
    expect(within(list).getByRole("option", { name: /Beranda/ })).toBeInTheDocument();
    expect(within(list).getByRole("option", { name: /Keamanan & Staf/ })).toBeInTheDocument();
    expect(
      within(list).queryByRole("option", { name: /Portofolio Bisnis/ }),
    ).not.toBeInTheDocument();
    expect(
      within(list).queryByRole("option", { name: /Kekayaan & Kas/ }),
    ).not.toBeInTheDocument();
  });

  it("cfo sees the permitted subset but not principal-only features", () => {
    open("cfo");
    const list = screen.getByRole("listbox");
    expect(within(list).getByRole("option", { name: /Portofolio Bisnis/ })).toBeInTheDocument();
    expect(within(list).getByRole("option", { name: /Investasi Pasar/ })).toBeInTheDocument();
    // filantropi/keluarga are principal-only.
    expect(within(list).queryByRole("option", { name: /Filantropi/ })).not.toBeInTheDocument();
    expect(within(list).queryByRole("option", { name: /Keluarga & Warisan/ })).not.toBeInTheDocument();
  });

  it("clicking an entry navigates to its owning slug and closes", () => {
    const { onNavigate, onClose } = open("principal");
    fireEvent.click(screen.getByRole("option", { name: /PT Energi Nusantara/ }));
    expect(onNavigate).toHaveBeenCalledWith("portofolio-bisnis");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when open is false", () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(
      <CommandPalette open={false} onClose={onClose} onNavigate={onNavigate} role="principal" />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
