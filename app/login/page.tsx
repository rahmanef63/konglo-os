import type { Viewport } from "next";
import { Landing } from "@/frontend/shared";
import { getDemoPassword } from "@/lib/demo";

// Committed-dark landing → pin chrome dark for this route (see app/page.tsx).
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#14130f" };

// /login = landing with the auth dialog opened. proxy.ts routes unauth users
// here; authed users are bounced to /os. Demo quick-login shown if DEMO_MODE=1.
// /login is ƒ dynamic (no force-dynamic directive needed): ConvexAuthNextjsServer
// provider reads the auth cookie, so Next opts the route out of static prerender.
// Benign consequence: the DEMO_MODE password is runtime-evaluated per request
// (getDemoPassword reads env at request time), NOT baked into a static artifact.
export default function LoginPage() {
  return <Landing defaultAuthOpen demoPassword={getDemoPassword()} />;
}
