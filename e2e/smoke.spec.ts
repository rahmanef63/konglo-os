import { expect, test } from "@playwright/test";

// Smoke suite — CI-ONLY (workflow_dispatch `e2e` job). Anonymous, no creds.
// Proves the deployed surface is wired: auth gate redirects, the sign-in
// surface renders, and the liveness/readiness probes answer. The authed
// demo-login + CRUD flow is sketched in the TODO block at the bottom (it needs
// DEMO_MODE credentials and is intentionally left out of the anonymous smoke).

test.describe("anonymous surface", () => {
  test("GET /os redirects an unauthenticated visitor to /login", async ({
    page,
  }) => {
    // proxy.ts gates /os(.*) — an anon request is 307'd to /login. Assert on
    // the settled URL rather than the raw status so the client-side landing on
    // /login is what we verify.
    await page.goto("/os");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });

  test("/login renders the sign-in surface", async ({ page }) => {
    await page.goto("/login");
    // The marketing hero headline is always present on the login surface.
    await expect(
      page.getByRole("heading", { name: /Satu ruang kerja/i }),
    ).toBeVisible();
    // /login opens the auth dialog by default (defaultAuthOpen) — the email +
    // password fields are the load-bearing proof the sign-in form is mounted.
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Kata sandi")).toBeVisible();
    // The submit button carries the Indonesian "Masuk" label.
    await expect(
      page.getByRole("button", { name: "Masuk", exact: true }),
    ).toBeVisible();
  });
});

test.describe("operational probes", () => {
  test("GET /api/health returns 200 liveness JSON", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      service: "konglo-os",
    });
  });

  test("GET /api/ready returns 200 readiness JSON", async ({ request }) => {
    // /api/ready is 200 only when NEXT_PUBLIC_CONVEX_URL is set AND the Convex
    // backend is reachable (else 503). The CI `e2e` job must provide a reachable
    // backend URL in env for this to pass.
    const res = await request.get("/api/ready");
    expect(res.status()).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ready: true });
  });
});

// TODO(e2e-authed): authenticated demo-login + CRUD round-trip. Requires the
// app to run with DEMO_MODE=1 and DEMO_PASSWORD set (or real seed creds passed
// via env), so it is NOT part of the anonymous smoke above. Outline:
//
//   const email = process.env.E2E_DEMO_EMAIL ?? "konglo@mail.com";
//   const password = process.env.E2E_DEMO_PASSWORD; // never hard-code creds
//   test.skip(!password, "needs E2E_DEMO_PASSWORD");
//
//   test("authed: sign in then create + delete a subsidiary", async ({ page }) => {
//     await page.goto("/login");
//     await page.getByPlaceholder("Email").fill(email);
//     await page.getByPlaceholder("Kata sandi").fill(password!);
//     await page.getByRole("button", { name: "Masuk", exact: true }).click();
//     await expect(page).toHaveURL(/\/os/);             // gate cleared
//     await page.getByRole("link", { name: /Portofolio Bisnis/i }).click();
//     await page.getByRole("button", { name: /Tambah/i }).click();
//     // ...fill the FormModal, submit, assert the new row, then Hapus to clean up.
//   });
