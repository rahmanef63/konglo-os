// Readiness probe — unlike /api/health (pure liveness), this reports whether the
// app can actually reach its Convex backend. Dokploy / orchestrators can gate
// traffic on this. No auth. Node runtime (default), never cached.
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 3000;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return Response.json(
      { ready: false, error: "NEXT_PUBLIC_CONVEX_URL not set" },
      { status: 503 },
    );
  }

  try {
    // Cheap reachability check: hit the Convex base. Any HTTP response (even a
    // 4xx) proves the backend is up; only a network/timeout failure is "not ready".
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok && res.status >= 500) {
      return Response.json(
        { ready: false, error: `convex returned ${res.status}` },
        { status: 503 },
      );
    }
    return Response.json({ ready: true, service: "konglo-os" });
  } catch (err) {
    const error = err instanceof Error ? err.message : "convex unreachable";
    return Response.json({ ready: false, error }, { status: 503 });
  }
}
