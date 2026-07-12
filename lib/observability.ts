// Dependency-free, SSR-safe error sink. Always logs with a "[konglo]" tag; if
// NEXT_PUBLIC_SENTRY_DSN is set, best-effort forwards via fetch. Swap-in seam
// for @sentry/nextjs later: replace the forward block, keep the signature.

type ErrorContext = Record<string, unknown>;

// Normalize unknown throwables into a stable {message, stack} shape.
function describe(error: unknown): { message: string; stack?: string } {
  return error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: String(error) };
}

// Best-effort POST to the Sentry DSN's store endpoint. Never throws; a failed
// report must not cascade. SEAM: replace this with Sentry.captureException.
function forward(
  dsn: string,
  payload: { message: string; stack?: string; context?: ErrorContext },
): void {
  if (typeof fetch !== "function") return;
  try {
    void fetch(dsn, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Swallow: telemetry delivery failures are non-fatal.
    });
  } catch {
    // Swallow: malformed DSN / unavailable fetch must not break the caller.
  }
}

// Capture an error. Always console.error with the "[konglo]" tag + context;
// forwards to Sentry only when a DSN is configured. SSR-safe (no window deref).
export function captureError(error: unknown, context?: ErrorContext): void {
  const { message, stack } = describe(error);
  console.error("[konglo]", message, context ?? {}, stack ?? "");

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) forward(dsn, { message, stack, context });
}
