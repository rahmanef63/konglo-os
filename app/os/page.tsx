import { OsShell } from "@/frontend/shared";

// Authenticated OS surface. proxy.ts gates unauth users to /login first.
export const dynamic = "force-dynamic";

export default function OsPage() {
  return <OsShell />;
}
