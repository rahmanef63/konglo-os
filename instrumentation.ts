// Next.js instrumentation entry point (stable in Next 16 — no next.config flag).
// `register` is a no-op for now: there is no OTel SDK to initialize. `onRequestError`
// is the server-side attach point for uncaught/server errors, routed through the
// shared `captureError` sink so the format (and the Sentry-DSN seam) stays consistent.

import { captureError } from "@/lib/observability";

// Runs once on server startup. SEAM: init an OTel/tracing SDK here if/when added.
export function register(): void {
  // No-op: no telemetry SDK to initialize yet.
}

// Next's server-side error hook. Forwards to the shared sink with the request +
// router context attached so server/uncaught errors land in the same structured
// place as captureError() calls (console.error now; Sentry once a DSN exists).
export function onRequestError(
  error: unknown,
  request: { path: string; method: string; headers: { [key: string]: string } },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource?:
      | "react-server-components"
      | "react-server-components-payload"
      | "server-rendering";
    revalidateReason?: "on-demand" | "stale" | undefined;
  },
): void {
  captureError(error, {
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  });
}
