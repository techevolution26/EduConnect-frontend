"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type { ContentStatus, ContentType, ContentVisibility } from "@/lib/types";

type ReviewAsset = {
    id: string;
    asset_type: "IMAGE" | "FILE" | string;
    url: string;
    filename?: string | null;
    mime_type?: string | null;
};

type ReviewItem = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    body: string;
    content_type: ContentType;
    visibility: ContentVisibility;
    is_premium: boolean;
    status: ContentStatus;
    created_at?: string;
    updated_at?: string;
    author?: {
        full_name?: string | null;
        username?: string | null;
    } | null;
    cover_image_url?: string | null;
    assets?: ReviewAsset[];
};

function statusBadge(status: ContentStatus) {
    const classes: Record<ContentStatus, string> = {
        DRAFT: "bg-white/10 text-white/70",
        PENDING_REVIEW: "bg-amber-500/10 text-amber-200",
        PUBLISHED: "bg-emerald-500/10 text-emerald-200",
        REJECTED: "bg-red-500/10 text-red-200",
        ARCHIVED: "bg-zinc-500/10 text-zinc-200",
    };

    return classes[status];
}

function getAuthorLabel(content: ReviewItem) {
    return (
        content.author?.full_name ??
        content.author?.username ??
        "Unknown author"
    );
}

function formatDate(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
}

function renderBody(body: string) {
    return body.split("\n").map((paragraph, index) => {
        const trimmed = paragraph.trim();
        if (!trimmed) {
            return <div key={index} className="h-4" />;
        }

        return (
            <p key={index} className="text-sm leading-7 text-white/75">
                {trimmed}
            </p>
        );
    });
}

export default function AdminReviewClient() {
    const queryClient = useQueryClient();

    const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>(
        {},
    );
    const [selectedContent, setSelectedContent] = useState<ReviewItem | null>(null);

    const pendingQuery = useQuery({
        queryKey: ["admin", "content", "pending"],
        queryFn: api.pendingContent,
    });

    const approveMutation = useMutation({
        mutationFn: api.approveContent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "content", "pending"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "content"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            setSelectedContent(null);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ contentId, reason }: { contentId: string; reason: string }) =>
            api.rejectContent(contentId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "content", "pending"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "content"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
            setSelectedContent(null);
        },
    });

    const items = (pendingQuery.data?.items ?? []) as ReviewItem[];

    const mutationError = useMemo(() => {
        if (approveMutation.error instanceof ApiError) {
            return approveMutation.error.detail;
        }

        if (rejectMutation.error instanceof ApiError) {
            return rejectMutation.error.detail;
        }

        return "Action failed.";
    }, [approveMutation.error, rejectMutation.error]);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setSelectedContent(null);
            }
        }

        if (selectedContent) {
            document.addEventListener("keydown", onKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [selectedContent]);

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
                        Review submissions before they become public. Open each item in a
                        readable modal, then approve or reject after reading the full piece.
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

                {items.length > 0 ? (
                    <section className="space-y-4">
                        {items.map((content) => (
                            <article
                                key={content.id}
                                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
                            >
                                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
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

                                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-semibold">{content.title}</h2>
                                        <p className="mt-1 text-xs text-white/35">/{content.slug}</p>
                                        <p className="mt-2 text-xs text-white/45">
                                            By {getAuthorLabel(content)}
                                            {content.created_at ? ` • ${formatDate(content.created_at)}` : ""}
                                        </p>
                                    </div>

                                    <span
                                        className={`w-fit rounded-full px-3 py-1 text-xs ${statusBadge(
                                            content.status,
                                        )}`}
                                    >
                                        {content.status}
                                    </span>
                                </div>

                                {content.excerpt ? (
                                    <p className="mt-3 text-sm leading-6 text-white/60">
                                        {content.excerpt}
                                    </p>
                                ) : null}

                                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <p className="line-clamp-4 text-sm leading-6 text-white/55">
                                        {content.body}
                                    </p>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedContent(content)}
                                        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
                                    >
                                        Preview & review
                                    </button>
                                </div>
                            </article>
                        ))}
                    </section>
                ) : null}

                {pendingQuery.data && items.length === 0 ? (
                    <EmptyState
                        title="No content found"
                        description="Try changing the filters or wait for new submissions."
                    />
                ) : null}
            </div>

            {selectedContent ? (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-3 py-6 backdrop-blur-sm">
                    <div className="mx-auto flex min-h-full max-w-5xl items-center">
                        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0d12] shadow-2xl">
                            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                                        Review preview
                                    </p>
                                    <h2 className="mt-1 truncate text-xl font-semibold text-white">
                                        {selectedContent.title}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedContent(null)}
                                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
                                <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
                                    <div className="px-5 py-5">
                                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
                                            <span>{selectedContent.content_type}</span>
                                            <span>•</span>
                                            <span>{selectedContent.visibility}</span>
                                            {selectedContent.is_premium ? (
                                                <>
                                                    <span>•</span>
                                                    <span>Premium</span>
                                                </>
                                            ) : null}
                                        </div>

                                        <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                                            <p className="text-sm font-medium text-white/80">
                                                By {getAuthorLabel(selectedContent)}
                                            </p>
                                            <p className="mt-1 text-xs text-white/45">
                                                {selectedContent.created_at
                                                    ? formatDate(selectedContent.created_at)
                                                    : ""}
                                            </p>
                                        </div>

                                        {selectedContent.excerpt ? (
                                            <div className="mt-4 rounded-[1.5rem] border border-amber-400/20 bg-amber-400/10 p-4">
                                                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">
                                                    Excerpt
                                                </p>
                                                <p className="mt-2 text-sm leading-6 text-amber-50/80">
                                                    {selectedContent.excerpt}
                                                </p>
                                            </div>
                                        ) : null}

                                        <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                                            <div className="prose prose-invert max-w-none">
                                                {renderBody(selectedContent.body)}
                                            </div>
                                        </div>

                                        {selectedContent.assets && selectedContent.assets.length > 0 ? (
                                            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                                                <h3 className="text-sm font-semibold text-white">
                                                    Attachments
                                                </h3>
                                                <div className="mt-3 space-y-2">
                                                    {selectedContent.assets.map((asset) => (
                                                        <a
                                                            key={asset.id}
                                                            href={asset.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
                                                        >
                                                            <span className="truncate">
                                                                {asset.filename || asset.asset_type}
                                                            </span>
                                                            <span className="shrink-0 text-white/40">
                                                                {asset.asset_type}
                                                            </span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="border-t border-white/10 px-5 py-5 lg:border-l lg:border-t-0">
                                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                                            <h3 className="text-sm font-semibold text-white">Actions</h3>

                                            <div className="mt-4 space-y-3">
                                                <button
                                                    type="button"
                                                    onClick={() => approveMutation.mutate(selectedContent.id)}
                                                    disabled={approveMutation.isPending}
                                                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                                                >
                                                    Approve
                                                </button>

                                                <input
                                                    value={rejectReasonById[selectedContent.id] ?? ""}
                                                    onChange={(event) =>
                                                        setRejectReasonById((current) => ({
                                                            ...current,
                                                            [selectedContent.id]: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="Rejection reason..."
                                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        rejectMutation.mutate({
                                                            contentId: selectedContent.id,
                                                            reason:
                                                                rejectReasonById[selectedContent.id] ||
                                                                "Content does not meet publishing guidelines.",
                                                        })
                                                    }
                                                    disabled={rejectMutation.isPending}
                                                    className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 disabled:opacity-60"
                                                >
                                                    Reject
                                                </button>
                                            </div>

                                            <p className="mt-4 text-xs leading-5 text-white/40">
                                                Read the full piece here before deciding. Use Escape or the X
                                                button to close this preview.
                                            </p>
                                        </div>

                                        {approveMutation.isError || rejectMutation.isError ? (
                                            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                                {mutationError}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </RoleGuard>
    );
}