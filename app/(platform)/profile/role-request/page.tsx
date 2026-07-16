"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useState } from "react";

import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type { UserRole } from "@/lib/types";

const requestableRoles: UserRole[] = ["WRITER", "TEACHER", "STUDENT", "PARENT"];

export default function RoleRequestPage() {
    const queryClient = useQueryClient();

    const [requestedRole, setRequestedRole] = useState<UserRole>("WRITER");
    const [reason, setReason] = useState("");

    const requestsQuery = useQuery({
        queryKey: ["role-requests", "me"],
        queryFn: api.myRoleRequests,
    });

    const mutation = useMutation({
        mutationFn: api.createRoleRequest,
        onSuccess: () => {
            setReason("");
            queryClient.invalidateQueries({ queryKey: ["role-requests", "me"] });
        },
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        mutation.mutate({
            requested_role: requestedRole,
            reason,
        });
    }

    const error =
        mutation.error instanceof ApiError
            ? mutation.error.detail
            : "Could not submit role request.";

    const items = requestsQuery.data ?? [];

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
                <div className="kanga" />
                <div className="p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-accent-text">
                        Role Request
                    </p>

                    <h1 className="font-display mt-3 text-3xl tracking-tight text-fg">
                        Request creator or learning access
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                        Request to become a writer, teacher, student, or parent. Admins review
                        requests before changing account roles.
                    </p>

                    <div className="mt-6">
                        <Link
                            href="/profile"
                            className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
                        >
                            Back to profile
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
                <form
                    onSubmit={handleSubmit}
                    className="h-fit rounded-[2rem] border border-border bg-surface p-6"
                >
                    <h2 className="font-display text-xl font-semibold">New request</h2>

                    <div className="mt-5 space-y-5">
                        <div>
                            <label className="text-sm text-fg-dim">Requested role</label>
                            <select
                                value={requestedRole}
                                onChange={(event) =>
                                    setRequestedRole(event.target.value as UserRole)
                                }
                                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none"
                            >
                                {requestableRoles.map((role) => (
                                    <option className="bg-surface text-fg" key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-fg-dim">Reason</label>
                            <textarea
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                rows={7}
                                minLength={10}
                                className="mt-2 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-fg outline-none"
                                placeholder="Explain why you need this role. Example: I want to publish poetry, teach CBC revision content, or manage children learning resources..."
                                required
                            />
                        </div>

                        {mutation.isError ? (
                            <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                                {error}
                            </p>
                        ) : null}

                        {mutation.isSuccess ? (
                            <p className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
                                Request submitted for admin review.
                            </p>
                        ) : null}

                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent disabled:opacity-60"
                        >
                            {mutation.isPending ? "Submitting..." : "Submit request"}
                        </button>
                    </div>
                </form>

                <section className="rounded-[2rem] border border-border bg-surface p-6">
                    <h2 className="font-display text-xl font-semibold">My requests</h2>

                    {requestsQuery.isLoading ? (
                        <div className="mt-5">
                            <LoadingState label="Loading requests..." />
                        </div>
                    ) : null}

                    {items.length > 0 ? (
                        <div className="mt-5 space-y-3">
                            {items.map((request) => (
                                <article
                                    key={request.id}
                                    className="rounded-2xl border border-border bg-surface-2 p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="font-display font-semibold">{request.requested_role}</h3>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs ${request.status === "APPROVED"
                                                ? "bg-success-soft text-success"
                                                : request.status === "REJECTED"
                                                    ? "bg-danger-soft text-danger"
                                                    : "bg-accent-soft text-accent-text"
                                                }`}
                                        >
                                            {request.status}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-fg-dim">
                                        {request.reason}
                                    </p>

                                    {request.admin_note ? (
                                        <p className="mt-3 rounded-2xl border border-border bg-surface p-3 text-sm leading-6 text-fg-dim">
                                            Admin note: {request.admin_note}
                                        </p>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    ) : null}

                    {requestsQuery.data && items.length === 0 ? (
                        <div className="mt-5">
                            <EmptyState
                                title="No role requests yet"
                                description="Submit a request when you need writer, teacher, student, or parent tools."
                            />
                        </div>
                    ) : null}
                </section>
            </section>
        </div>
    );
}