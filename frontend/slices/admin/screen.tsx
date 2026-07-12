"use client";

import { UserTable } from "./user-table";
import { AdminInsights } from "./insights";
import { DataHealth, OrgActivity } from "./sections";
import { AdminTrafficCard } from "./traffic";

// Admin & Akses — principal-only. Composes the access roster (UserTable), the
// rule-based Saran & Kritik panel (AdminInsights), data/activity oversight, and
// public-site traffic. Real gate is server-side (every Convex fn requirePrincipal;
// traffic requireAdmin). rr: compose slices, don't accumulate one giant screen.
export default function AdminScreen() {
  return (
    <div className="space-y-4">
      <UserTable />
      <AdminInsights />

      <div className="grid gap-4 lg:grid-cols-2">
        <DataHealth />
        <OrgActivity />
      </div>

      <AdminTrafficCard />
    </div>
  );
}
