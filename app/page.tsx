import type { Viewport } from "next";
import { Landing } from "@/frontend/shared";
import { getDemoPassword } from "@/lib/demo";

// Public marketing landing. proxy.ts sends authed users to /os.
export const dynamic = "force-dynamic";

// The landing is committed-dark → pin the browser chrome / iOS status bar dark
// (overrides the layout's light/dark themeColor for this route only).
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#14130f" };

export default function Page() {
  return <Landing demoPassword={getDemoPassword()} />;
}
