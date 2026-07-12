"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionCard, useToast } from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/lib/roles";
import { DataHealth, OrgActivity } from "./sections";
import { AdminTrafficCard } from "./traffic";

// Admin & Akses — principal-only user/role management over the existing roles
// table. Real gate is server-side (listUsersWithRoles/setRole/revokeRole all
// requirePrincipal); this UI only exposes what OAuth makes necessary: grant a
// new Google login a role, re-tier, or revoke. `principal` is never assignable
// here (seed/allowlist only) and you can't change your own row.
const ROLE_LABEL: Record<Role, string> = { principal: "Principal", cfo: "CFO", staf: "Staf" };

function RoleBadge({ role }: { role: Role | null }) {
  const cls = role === "principal"
    ? "border-[color:var(--color-gold)]/45 text-[color:var(--color-gold)]"
    : role
      ? "border-border text-foreground"
      : "border-dashed border-border text-muted-foreground";
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {role ? ROLE_LABEL[role] : "Belum ada akses"}
    </span>
  );
}

export default function AdminScreen() {
  const users = useQuery(api.features.rbac.queries.listUsersWithRoles);
  const setRole = useMutation(api.features.rbac.mutations.setRole);
  const revoke = useMutation(api.features.rbac.mutations.revokeRole);
  const toast = useToast();

  const act = async (p: Promise<unknown>, ok: string) => {
    try {
      await p;
      toast(ok, "success");
    } catch (e) {
      toast((e as Error).message.replace(/^.*Forbidden:\s*/, "") || "Gagal", "error");
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Kelola Akses"
        sub="Pengguna & peran — hanya principal. Peran datang dari allowlist saat masuk; beri atau cabut akses di sini."
      >
        {users === undefined ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pengguna.</p>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li key={u.userId} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-xs font-bold text-foreground">
                  {(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{u.name ?? u.email ?? "—"}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {u.email ?? "tanpa email"}
                    {u.activeSessions > 0 && (
                      <span className="ml-1.5 text-[color:var(--color-mk-green)]">
                        · {u.activeSessions} sesi aktif
                      </span>
                    )}
                  </div>
                </div>
                <RoleBadge role={u.role} />
                {u.isSelf ? (
                  <span className="shrink-0 text-xs text-muted-foreground">Anda sendiri</span>
                ) : u.role === "principal" ? null : (
                  <div className="flex shrink-0 gap-1.5">
                    {u.role !== "cfo" && (
                      <Button size="sm" variant="outline" onClick={() => act(setRole({ userId: u.userId, role: "cfo" }), "Dijadikan CFO")}>
                        CFO
                      </Button>
                    )}
                    {u.role !== "staf" && (
                      <Button size="sm" variant="outline" onClick={() => act(setRole({ userId: u.userId, role: "staf" }), "Dijadikan Staf")}>
                        Staf
                      </Button>
                    )}
                    {u.role !== null && (
                      <Button size="sm" variant="ghost" onClick={() => act(revoke({ userId: u.userId }), "Akses dicabut")}>
                        Cabut
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <DataHealth />
        <OrgActivity />
      </div>

      <AdminTrafficCard />
    </div>
  );
}
