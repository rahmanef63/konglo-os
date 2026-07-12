"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionCard, useToast } from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { formatDateTimeID, timeAgoID } from "@/lib/format";

// Kelola Akses — the user/role roster as a scrollable table. principal-only
// (server gate: listUsersWithRoles/setRole/revokeRole all requirePrincipal).
// Columns surface who signed up, WHEN (+ time), a coarse WHERE (browser time zone
// captured at login — no IP/geo stored), and their latest activity. The table
// scrolls both ways: max-h caps the height, min-w keeps columns readable and lets
// the row scroll horizontally on phones instead of squashing.

function RoleBadge({ role }: { role: Role | null }) {
  const cls = role === "principal"
    ? "border-[color:var(--color-gold)]/45 text-[color:var(--color-gold)]"
    : role
      ? "border-border text-foreground"
      : "border-dashed border-border text-muted-foreground";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {role ? ROLE_LABEL[role] : "Belum ada akses"}
    </span>
  );
}

// "Asia/Jakarta" → "Jakarta"; "America/New_York" → "New York". Coarse + readable.
function tzCity(tz: string | null): string {
  if (!tz) return "—";
  return tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
}

export function UserTable() {
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
    <SectionCard
      title="Kelola Akses"
      sub="Pengguna & peran — hanya principal. Kapan & di zona waktu mana mereka mendaftar, plus aktivitas terakhirnya."
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
        <div className="max-h-96 overflow-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="py-2 pr-3">Pengguna</th>
                <th className="px-3 py-2">Peran</th>
                <th className="px-3 py-2">Terdaftar</th>
                <th className="px-3 py-2">Lokasi</th>
                <th className="px-3 py-2">Aktivitas</th>
                <th className="py-2 pl-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.userId} className="align-middle">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-xs font-bold text-foreground">
                        {(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{u.name ?? u.email ?? "—"}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {u.email ?? "tanpa email"}
                          {u.activeSessions > 0 && (
                            <span className="ml-1.5 text-[color:var(--color-mk-green)]">· {u.activeSessions} sesi aktif</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><RoleBadge role={u.role} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                    {formatDateTimeID(u.registeredAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground" title={u.timeZone ?? undefined}>
                    {tzCity(u.timeZone)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                    {u.lastActivityAt ? timeAgoID(u.lastActivityAt) : "Belum ada"}
                  </td>
                  <td className="py-3 pl-3 text-right">
                    {u.isSelf ? (
                      <span className="whitespace-nowrap text-xs text-muted-foreground">Anda sendiri</span>
                    ) : u.role === "principal" ? null : (
                      <div className="flex justify-end gap-1.5">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
