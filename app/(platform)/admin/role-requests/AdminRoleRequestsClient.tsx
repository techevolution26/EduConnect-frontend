"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type { RoleRequestStatus } from "@/lib/types";

const statusOptions: Array<RoleRequestStatus | ""> = [
    "",
    "PENDING",
    "APPROVED",
    "REJECTED",
];

export default function AdminRoleRequestsClient() {
    const queryClient = useQueryClient();

    const [statusFilter, setStatusFilter] = useState<RoleRequestStatus | "">("");
    const [noteById, setNoteById] = useState<Record<string, string>>({});

    const requestsQuery = useQuery({
        queryKey: ["admin", "role-requests", statusFilter],
        queryFn: () =>
            api.adminRoleRequests({
                status_filter: statusFilter || undefined,
            }),
    });

    const approveMutation = useMutation({
        mutationFn: ({ requestId, note }: { requestId: string; note?: string }) =>
            api.approveRoleRequest(requestId, note ?? null),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "role-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ requestId, note }: { requestId: string; note?: string }) =>
            api.rejectRoleRequest(requestId, note ?? null),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "role-requests"] });
        },
    });

    const items = requestsQuery.data?.items ?? [];

    const error = useMemo(() => {
        if (approveMutation.error instanceof ApiError) {
            return approveMutation.error.detail;
        }

        if (rejectMutation.error instanceof ApiError) {
            return rejectMutation.error.detail;
        }

        return "Action failed.";
    }, [approveMutation.error, rejectMutation.error]);

    return (
        <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <div className="space-y-8">
                <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
                        Admin Role Requests
                    </p>

                    <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">
                        Review account role requests
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                        Approve writers, teachers, students, and parents after reviewing
                        their stated purpose.
                    </p>
                </section>

                <section className="rounded-[2rem] border border-border bg-surface p-5">
                    <label className="text-sm text-fg-dim">Status filter</label>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value as RoleRequestStatus | "")
                        }
                        className="mt-2 w-full max-w-xs rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                    >
                        {statusOptions.map((status) => (
                            <option
                                className="bg-surface text-fg"
                                key={status || "ALL"}
                                value={status}
                            >
                                {status || "All statuses"}
                            </option>
                        ))}
                    </select>
                </section>

                {requestsQuery.isLoading ? (
                    <LoadingState label="Loading role requests..." />
                ) : null}

                {requestsQuery.isError ? (
                    <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                        Could not load role requests.
                    </div>
                ) : null}

                {approveMutation.isError || rejectMutation.isError ? (
                    <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                        {error}
                    </div>
                ) : null}

                {items.length > 0 ? (
                    <section className="space-y-4">
                        {items.map((request) => (
                            <article
                                key={request.id}
                                className="rounded-[2rem] border border-border bg-surface p-5"
                            >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-fg-dim">
                                            {request.user?.email ?? "Unknown user"}
                                        </p>

                                        <h2 className="font-display mt-2 text-2xl font-semibold">
                                            {request.requested_role}
                                        </h2>

                                        <p className="mt-2 text-sm text-fg-dim">
                                            Requested by {request.user?.full_name ?? request.user_id}
                                        </p>
                                    </div>

                                    <span
                                        className={`w-fit rounded-full px-3 py-1 text-xs ${request.status === "APPROVED"
                                            ? "bg-success-soft text-success"
                                            : request.status === "REJECTED"
                                                ? "bg-danger-soft text-danger"
                                                : "bg-accent-soft text-accent"
                                            }`}
                                    >
                                        {request.status}
                                    </span>
                                </div>

                                <p className="mt-4 rounded-2xl border border-border bg-surface-2 p-4 text-sm leading-6 text-fg-dim">
                                    {request.reason}
                                </p>

                                {request.admin_note ? (
                                    <p className="mt-3 rounded-2xl border border-border bg-surface p-4 text-sm leading-6 text-fg-dim">
                                        Admin note: {request.admin_note}
                                    </p>
                                ) : null}

                                {request.status === "PENDING" ? (
                                    <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                                        <input
                                            value={noteById[request.id] ?? ""}
                                            onChange={(event) =>
                                                setNoteById((current) => ({
                                                    ...current,
                                                    [request.id]: event.target.value,
                                                }))
                                            }
                                            placeholder="Optional admin note..."
                                            className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                rejectMutation.mutate({
                                                    requestId: request.id,
                                                    note:
                                                        noteById[request.id] ||
                                                        "Your role request was not approved at this time.",
                                                })
                                            }
                                            disabled={rejectMutation.isPending}
                                            className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger disabled:opacity-60"
                                        >
                                            Reject
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                approveMutation.mutate({
                                                    requestId: request.id,
                                                    note:
                                                        noteById[request.id] || "Your role request was approved.",
                                                })
                                            }
                                            disabled={approveMutation.isPending}
                                            className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent disabled:opacity-60"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                ) : null}
                            </article>
                        ))}
                    </section>
                ) : null}

                {requestsQuery.data && items.length === 0 ? (
                    <EmptyState
                        title="No role requests found"
                        description="Role upgrade requests will appear here for admin review."
                    />
                ) : null}
            </div>
        </RoleGuard>
    );
}