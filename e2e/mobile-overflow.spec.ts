import { test, expect } from "@playwright/test";

// Mobile horizontal-overflow sweep. A bottom dock is only half a mobile UX — the
// content screens must not overflow horizontally either. principal sees all 12
// slices, so one authed pass over every feature on a phone viewport catches any
// slice whose layout pushes the document wider than the screen (the canonical
// "broken on mobile" signal). Document-level scrollWidth > clientWidth means an
// element escaped the viewport; contained overflow-x regions don't trip it.
// Swept at BOTH 320px (iPhone SE / smallest supported) and 390px (standard phone)
// so a breakpoint that only breaks on the tightest device is still caught.
const PASSWORD = process.env.DEMO_PASSWORD ?? process.env.KONGLO_SEED_PASSWORD;
const PRINCIPAL = process.env.E2E_PRINCIPAL_EMAIL ?? "konglo@mail.com";

const FEATURES = [
  "Beranda",
  "Portofolio Bisnis",
  "Kekayaan & Kas",
  "Investasi Pasar",
  "Properti & Aset",
  "Keluarga & Warisan",
  "Gaya Hidup",
  "Kesehatan",
  "Filantropi",
  "Relasi & Jaringan",
  "Keamanan & Staf",
  "Studio Data",
];

for (const VW of [320, 390]) {
  test.describe(`mobile overflow sweep @ ${VW}px`, () => {
    test.skip(!PASSWORD, "needs DEMO_PASSWORD or KONGLO_SEED_PASSWORD in env");
    test.use({ viewport: { width: VW, height: 844 } });

    test(`no horizontal overflow on any slice at ${VW}px`, async ({ page }) => {
      await page.goto("/login");
      const dialog = page.getByLabel("Masuk Konglo OS");
      await dialog.getByPlaceholder("Email").fill(PRINCIPAL);
      await dialog.getByPlaceholder("Kata sandi").fill(PASSWORD!);
      await dialog.getByRole("button", { name: "Masuk", exact: true }).click();
      await expect(page).toHaveURL(/\/os(\?.*)?$/);

      const offenders: string[] = [];
      for (const label of FEATURES) {
        // Navigate via the command palette (dock "Menu" slot opens it) — uniform
        // for all 12 features regardless of dock-tab vs overflow.
        await page.getByRole("button", { name: "Menu" }).click();
        await page
          .getByRole("option", { name: new RegExp(label) })
          .first()
          .click();
        // Active title confirms the screen switched before we measure.
        await expect(
          page.getByRole("heading", { level: 1, name: label }),
        ).toBeVisible();
        const overflow = await page.evaluate(() => {
          const el = document.scrollingElement ?? document.documentElement;
          return el.scrollWidth - el.clientWidth;
        });
        if (overflow > 1) offenders.push(`${label} +${overflow}px`);
      }
      console.log(`OVERFLOW_REPORT@${VW} ` + JSON.stringify(offenders));
      expect(
        offenders,
        `horizontal overflow at ${VW}px on: ${offenders.join(", ")}`,
      ).toEqual([]);
    });
  });
}
