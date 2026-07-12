// Liveness probe for Dokploy / compose healthcheck. No auth, no DB.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, service: "konglo-os" });
}
