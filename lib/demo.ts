// Server-only demo config. DEMO_PASSWORD is a RUNTIME env (NOT NEXT_PUBLIC) so it
// is never baked into the client bundle — it is forwarded to the auth surface as a
// prop only when DEMO_MODE=1. Import from server components only.
// Enable on the live demo: set DEMO_MODE=1 + DEMO_PASSWORD=… in Dokploy app env.
export function getDemoPassword(): string | undefined {
  return process.env.DEMO_MODE === "1" ? process.env.DEMO_PASSWORD : undefined;
}
