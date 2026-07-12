import { expect, test, type Page } from "@playwright/test";

// Authed e2e safety net — CI-ONLY (workflow_dispatch `e2e` job). This is the net
// the project lacked when sign-in broke TWICE on an unconditional profile()
// gate: it drives a REAL browser login for both seeded roles and proves the RBAC
// menu split + a full create→assert→delete CRUD round-trip.
//
// Creds come from env ONLY — never hard-coded. The live demo surface forwards
// DEMO_PASSWORD (DEMO_MODE=1); the seed script uses KONGLO_SEED_PASSWORD. Accept
// either so the same spec runs against a demo container or a freshly seeded one.
// Without a password the whole file is skipped (not failed) so `--list` still
// discovers it and a credential-less sandbox run stays green.
const PASSWORD = process.env.DEMO_PASSWORD ?? process.env.KONGLO_SEED_PASSWORD;
const PRINCIPAL = process.env.E2E_PRINCIPAL_EMAIL ?? "konglo@mail.com";
const CFO = process.env.E2E_CFO_EMAIL ?? "ajudan@mail.com";

// Menu labels are the load-bearing RBAC signal (lib/roles.ts ROLE_MENU drives
// frontend/slices/menu.ts). principal = "all" → sees succession; cfo's allow-list
// excludes "keluarga-warisan" (the heirs/estate slice — SEC-001 principal-only).
const PRINCIPAL_ONLY_MENU = "Keluarga & Warisan"; // slug keluarga-warisan
const SHARED_MENU = "Studio Data"; // slug data-studio — visible to cfo too

// Sign in through the real /login form (email + "Kata sandi" + "Masuk"), the
// exact path that regressed before. AuthForm hard-navigates to /os on success,
// so awaiting the /os URL is the gate-cleared assertion.
async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  // Scope to the auth dialog: the /login surface also renders banner + footer
  // "Masuk" nav links, so an unscoped getByRole("button", {name:"Masuk"}) hits 3
  // elements (strict-mode violation). The dialog is labelled "Masuk Konglo OS".
  const dialog = page.getByLabel("Masuk Konglo OS");
  await dialog.getByPlaceholder("Email").fill(email);
  await dialog.getByPlaceholder("Kata sandi").fill(password);
  await dialog.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/os(\?.*)?$/);
}

test.describe("authed RBAC + CRUD", () => {
  // Skip the whole suite (still listed) when no password is wired in.
  test.skip(!PASSWORD, "needs DEMO_PASSWORD or KONGLO_SEED_PASSWORD in env");

  test("principal signs in, lands on /os, sees the principal-only menu", async ({
    page,
  }) => {
    await signIn(page, PRINCIPAL, PASSWORD!);
    // The nav renders one <button> per allowed feature. principal = "all".
    await expect(
      page.getByRole("button", { name: PRINCIPAL_ONLY_MENU }),
    ).toBeVisible();
  });

  test("cfo sees its menu but NOT the heirs/succession menu", async ({
    page,
  }) => {
    await signIn(page, CFO, PASSWORD!);
    // cfo's allow-list includes data-studio…
    await expect(page.getByRole("button", { name: SHARED_MENU })).toBeVisible();
    // …but the estate/succession slice is principal-ONLY and must be absent.
    await expect(
      page.getByRole("button", { name: PRINCIPAL_ONLY_MENU }),
    ).toHaveCount(0);
  });

  test("principal: create → assert visible → delete a subsidiary", async ({
    page,
  }) => {
    await signIn(page, PRINCIPAL, PASSWORD!);

    // Open Portofolio Bisnis (subsidiaries — a simple CRUD slice).
    await page.getByRole("button", { name: "Portofolio Bisnis" }).click();

    // A unique name so the round-trip is self-isolating across reruns/retries.
    const name = `E2E PT Uji ${Date.now()}`;

    // CREATE: "+ Tambah" opens the FormModal; fill the required fields.
    await page.getByRole("button", { name: "+ Tambah" }).click();
    await page.getByLabel("Nama anak usaha").fill(name);
    await page.getByLabel("Sektor").fill("Uji E2E");
    await page.getByLabel("Pendapatan (triliun Rp)").fill("1.5");
    await page.getByLabel("Margin EBITDA (%)").fill("20");
    await page.getByLabel("Kepemilikan (%)").fill("100");
    await page.getByRole("button", { name: "Simpan", exact: true }).click();

    // ASSERT VISIBLE: the new row shows up in "Kinerja Anak Usaha".
    const row = page.getByText(name, { exact: true });
    await expect(row).toBeVisible();

    // DELETE (cleanup): open the row's DetailSheet, hit "Hapus". Delete is
    // guarded by a native window.confirm — auto-accept it before clicking.
    await row.click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Hapus", exact: true }).click();

    // The row is gone once the mutation lands.
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
});

// Mobile bottom dock (OsDock) is the mobile primary nav. Below md the desktop
// sidebar <aside> is display:none, so on a phone viewport the dock is the sole
// navigation landmark; its "Menu" overflow button is dock-only (the topbar has
// only "Cari"/"Keluar"). jsdom unit tests can't exercise the md breakpoint, so
// this real-viewport check is the only guard that the dock actually shows on
// mobile and hides on desktop.
test.describe("mobile bottom dock", () => {
  test.skip(!PASSWORD, "needs DEMO_PASSWORD or KONGLO_SEED_PASSWORD in env");
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone-class portrait

  test("renders the fixed dock with RBAC tabs + Menu on mobile /os", async ({
    page,
  }) => {
    await signIn(page, PRINCIPAL, PASSWORD!);
    const dock = page.getByRole("navigation", { name: "Navigasi utama" });
    await expect(dock).toBeVisible();
    await expect(dock.getByRole("button", { name: "Menu" })).toBeVisible();
    await expect(dock.getByRole("button", { name: "Beranda" })).toBeVisible();
  });
});

// Mobile shell extras: the iPhone-style home (app-grid springboard, replaces the
// desktop dashboard below md) + the right-header quick-nav drawer (trigger is
// md:hidden). jsdom can't exercise the md breakpoint, so this is the real guard.
test.describe("mobile iphone-home + quick-nav drawer", () => {
  test.skip(!PASSWORD, "needs DEMO_PASSWORD or KONGLO_SEED_PASSWORD in env");
  test.use({ viewport: { width: 390, height: 844 } });

  test("home shows the app-grid; the right-header drawer jumps to a feature", async ({
    page,
  }) => {
    await signIn(page, PRINCIPAL, PASSWORD!);
    // iPhone-home springboard: app-grid is a <nav aria-label="Aplikasi">.
    const grid = page.getByRole("navigation", { name: "Aplikasi" });
    await expect(grid).toBeVisible();
    await expect(
      grid.getByRole("button", { name: "Studio Data" }),
    ).toBeVisible();

    // Right-header quick-nav: trigger opens a dialog reusing the feature nav;
    // selecting a feature navigates (the topbar h1 updates) and closes it.
    await page.getByRole("button", { name: "Navigasi cepat" }).click();
    const drawer = page.getByRole("dialog", { name: "Navigasi cepat" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: /Kesehatan/ }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Kesehatan" }),
    ).toBeVisible();
  });
});

// On desktop the dock is md:hidden (display:none) → its unique "Menu" button is
// absent from the a11y tree; only the sidebar nav remains.
test.describe("desktop hides the mobile dock", () => {
  test.skip(!PASSWORD, "needs DEMO_PASSWORD or KONGLO_SEED_PASSWORD in env");

  test("no dock Menu button at desktop width", async ({ page }) => {
    await signIn(page, PRINCIPAL, PASSWORD!);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
  });
});
