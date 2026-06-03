"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";

export default function AdminReviewClient() {
    const queryClient = useQueryClient();
    const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>(
        {},
    );

    const pendingQuery = useQuery({
        queryKey: ["admin", "content", "pending"],
        queryFn: api.pendingContent,
    });

    const approveMutation = useMutation({
        mutationFn: api.approveContent,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["admin", "content", "pending"],
            });
            queryClient.invalidateQueries({
                queryKey: ["feed"],
            });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ contentId, reason }: { contentId: string; reason: string }) =>
            api.rejectContent(contentId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["admin", "content", "pending"],
            });
        },
    });

    const mutationError =
        approveMutation.error instanceof ApiError
            ? approveMutation.error.detail
            : rejectMutation.error instanceof ApiError
                ? rejectMutation.error.detail
                : "Action failed.";

    return (
        <RoleGuard allowedRoles={["MODERATOR", "ADMIN"]}>
            <div className="space-y-8">
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                        Admin Review
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                        Content approval queue
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                        Review submitted content before it becomes visible to the public.
                        This protects children, learning materials, faith content, and the
                        wider community from unsafe or misleading posts.
                    </p>
                </section>

                {pendingQuery.isLoading ? (
                    <LoadingState label="Loading pending content..." />
                ) : null}

                {pendingQuery.isError ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        Could not load pending content.
                    </div>
                ) : null}

                {approveMutation.isError || rejectMutation.isError ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {mutationError}
                    </div>
                ) : null}

                {pendingQuery.data && pendingQuery.data.items.length > 0 ? (
                    <section className="space-y-4">
                        {pendingQuery.data.items.map((content) => (
                            <article
                                key={content.id}
                                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
                            >
                                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40">
                                    <span>{content.content_type}</span>
                                    <span>•</span>
                                    <span>{content.visibility}</span>
                                    {content.is_premium ? (
                                        <>
                                            <span>•</span>
                                            <span>Premium</span>
                                        </>
                                    ) : null}
                                </div>

                                <h2 className="mt-3 text-2xl font-semibold">{content.title}</h2>

                                {content.excerpt ? (
                                    <p className="mt-3 text-sm leading-6 text-white/60">
                                        {content.excerpt}
                                    </p>
                                ) : null}

                                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <p className="line-clamp-5 text-sm leading-6 text-white/60">
                                        {content.body}
                                    </p>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                                    <input
                                        value={rejectReasonById[content.id] ?? ""}
                                        onChange={(event) =>
                                            setRejectReasonById((current) => ({
                                                ...current,
                                                [content.id]: event.target.value,
                                            }))
                                        }
                                        placeholder="Rejection reason..."
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            rejectMutation.mutate({
                                                contentId: content.id,
                                                reason:
                                                    rejectReasonById[content.id] ||
                                                    "Content does not meet publishing guidelines.",
                                            })
                                        }
                                        disabled={rejectMutation.isPending}
                                        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 disabled:opacity-60"
                                    >
                                        Reject
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => approveMutation.mutate(content.id)}
                                        disabled={approveMutation.isPending}
                                        className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </article>
                        ))}
                    </section>
                ) : null}

                {pendingQuery.data && pendingQuery.data.items.length === 0 ? (
                    <EmptyState
                        title="No pending content"
                        description="Submitted drafts will appear here for admin or moderator approval."
                    />
                ) : null}
            </div>
        </RoleGuard>
    );
}