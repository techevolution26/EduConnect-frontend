"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import RoleGuard from "@/components/auth/RoleGuard";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { ALL_PERMISSIONS, PERMISSION_LABELS } from "@/lib/types";
import type { Permission } from "@/lib/types";

export default function AdminPermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Only ADMIN-role accounts can hold scoped permissions -- SUPER_ADMIN
  // implicitly has everything, so we only need to list admins here.
  const adminsQuery = useQuery({
    queryKey: ["admin", "users", "ADMIN", search],
    queryFn: () => api.adminUsers({ role: "ADMIN", search, limit: 100 }),
    retry: false,
  });

  const permissionsQuery = useQuery({
    queryKey: ["admin", "permissions", selectedUserId],
    queryFn: () => api.getUserPermissions(selectedUserId!),
    enabled: Boolean(selectedUserId),
    retry: false,
  });

  const grantMutation = useMutation({
    mutationFn: (permission: Permission) =>
      api.grantUserPermission(selectedUserId!, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions", selectedUserId] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (permission: Permission) =>
      api.revokeUserPermission(selectedUserId!, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions", selectedUserId] });
    },
  });

  const admins = adminsQuery.data?.items ?? [];
  const grantedPermissions = new Set(permissionsQuery.data?.permissions ?? []);
  const selectedAdmin = admins.find((a) => a.id === selectedUserId);

  const mutationError =
    grantMutation.error instanceof ApiError
      ? grantMutation.error.detail
      : revokeMutation.error instanceof ApiError
        ? revokeMutation.error.detail
        : null;

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent-text" />
            <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
              Super admin
            </p>
          </div>
          <h1 className="font-display mt-3 text-2xl font-semibold text-fg sm:text-3xl">
            Admin permissions
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-dim">
            Grant specific admins exactly the capabilities they need. Every
            permission here is off by default — an admin with no granted
            permissions can sign in but can&apos;t manage anything until you grant
            access.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
          {/* Admin list */}
          <section className="rounded-[2rem] border border-border bg-surface p-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admins..."
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
            />

            {adminsQuery.isLoading ? (
              <div className="mt-4">
                <LoadingState label="Loading admins..." />
              </div>
            ) : null}

            <div className="mt-3 space-y-1">
              {admins.map((admin) => (
                <button
                  key={admin.id}
                  type="button"
                  onClick={() => setSelectedUserId(admin.id)}
                  className={`block w-full rounded-2xl px-4 py-3 text-left transition ${
                    selectedUserId === admin.id
                      ? "bg-accent text-on-accent"
                      : "hover:bg-surface-2"
                  }`}
                >
                  <p className="text-sm font-medium">{admin.full_name}</p>
                  <p
                    className={`text-xs ${
                      selectedUserId === admin.id ? "text-on-accent/70" : "text-fg-dim"
                    }`}
                  >
                    {admin.email}
                  </p>
                </button>
              ))}
            </div>

            {!adminsQuery.isLoading && admins.length === 0 ? (
              <p className="mt-4 text-sm text-fg-dim">
                No ADMIN-role accounts found. Promote a user to Admin from the
                dashboard first.
              </p>
            ) : null}
          </section>

          {/* Permission grid for selected admin */}
          <section className="rounded-[2rem] border border-border bg-surface p-5">
            {!selectedUserId ? (
              <p className="text-sm text-fg-dim">
                Select an admin on the left to manage their permissions.
              </p>
            ) : (
              <>
                <h2 className="font-display text-xl font-semibold">
                  {selectedAdmin?.full_name ?? "Admin"}
                </h2>
                <p className="mt-1 text-sm text-fg-dim">{selectedAdmin?.email}</p>

                {mutationError ? (
                  <p className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                    {mutationError}
                  </p>
                ) : null}

                {permissionsQuery.isLoading ? (
                  <div className="mt-5">
                    <LoadingState label="Loading permissions..." />
                  </div>
                ) : (
                  <div className="mt-5 space-y-2">
                    {ALL_PERMISSIONS.map((permission) => {
                      const granted = grantedPermissions.has(permission);
                      return (
                        <div
                          key={permission}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-2 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-fg">
                              {PERMISSION_LABELS[permission]}
                            </p>
                            <p className="text-xs text-fg-dim">{permission}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              granted
                                ? revokeMutation.mutate(permission)
                                : grantMutation.mutate(permission)
                            }
                            disabled={grantMutation.isPending || revokeMutation.isPending}
                            className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                              granted
                                ? "border border-danger/30 bg-danger-soft text-danger"
                                : "bg-accent text-on-accent hover:opacity-90"
                            }`}
                          >
                            {granted ? "Revoke" : "Grant"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </RoleGuard>
  );
}
