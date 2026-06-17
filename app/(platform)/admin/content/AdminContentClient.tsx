"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type {
    ChildrenAgeGroup,
    ContentStatus,
    ContentType,
    ContentVisibility,
} from "@/lib/types";

type AdminContentAsset = {
    id: string;
    asset_type: "IMAGE" | "FILE" | string;
    url: string;
    filename?: string | null;
    mime_type?: string | null;
};

type AdminContentItem = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    body: string;
    content_type: ContentType;
    visibility: ContentVisibility;
    is_premium: boolean;
    is_featured: boolean;
    status: ContentStatus;
    created_at?: string;
    updated_at?: string;
    author?: {
        full_name?: string | null;
        username?: string | null;
    } | null;
    cover_image_url?: string | null;
    assets?: AdminContentAsset[];
};

const statusOptions: Array<ContentStatus | ""> = [
    "",
    "DRAFT",
    "PENDING_REVIEW",
    "PUBLISHED",
    "REJECTED",
    "ARCHIVED",
];

const contentTypeOptions: Array<ContentType | ""> = [
    "",
    "ARTICLE",
    "STORY",
    "FICTION",
    "POEM",
    "FAITH",
    "EDUCATION",
    "CHILDREN",
    "NEWS",
    "AUDIO",
    "WRITING_TIPS",
    "SELF_IMPROVEMENT",
    "RELATIONSHIP",
    "MONEY_FINANCE",
    "MEDICINE",
    "PSYCHOLOGY",
    "MENTAL_HEALTH",
    "HUMOR",
    "WOMEN",
    "FITNESS",
    "SELF_AWARENESS",
    "PARENTING",
];

const ageGroupOptions: ChildrenAgeGroup[] = [
    "AGE_3_5",
    "AGE_6_9",
    "AGE_10_13",
];

const ageGroupLabels: Record<ChildrenAgeGroup, string> = {
    AGE_3_5: "3–5 years",
    AGE_6_9: "6–9 years",
    AGE_10_13: "10–13 years",
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

function getAuthorLabel(content: AdminContentItem) {
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

export default function AdminContentClient() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<ContentStatus | "">("");
    const [typeFilter, setTypeFilter] = useState<ContentType | "">("");
    const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>(
        {},
    );
    const [ageGroupByContentId, setAgeGroupByContentId] = useState<
        Record<string, ChildrenAgeGroup>
    >({});
    const [selectedContent, setSelectedContent] = useState<AdminContentItem | null>(null);

    const contentQuery = useQuery({
        queryKey: ["admin", "content", search, statusFilter, typeFilter],
        queryFn: () =>
            api.adminContent({
                limit: 50,
                search,
                status_filter: statusFilter || undefined,
                content_type: typeFilter || undefined,
            }),
    });

    const approveMutation = useMutation({
        mutationFn: api.approveContent,
        onSuccess: () => {
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
            queryClient.invalidateQueries({ queryKey: ["admin", "content"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
            setSelectedContent(null);
        },
    });

    const attachChildrenMutation = useMutation({
        mutationFn: ({
            contentId,
            ageGroup,
        }: {
            contentId: string;
            ageGroup: ChildrenAgeGroup;
        }) =>
            api.createChildrenContent({
                content_id: contentId,
                age_group: ageGroup,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["children"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "content"] });
        },
    });

    const toggleFeatureMutation = useMutation({
        mutationFn: (contentId: string) => api.toggleFeaturedContent(contentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "content"] });
            queryClient.invalidateQueries({ queryKey: ["feed", "discover"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
        },
    });

    const mutationError = useMemo(() => {
        if (approveMutation.error instanceof ApiError) {
            return approveMutation.error.detail;
        }

        if (rejectMutation.error instanceof ApiError) {
            return rejectMutation.error.detail;
        }

        if (attachChildrenMutation.error instanceof ApiError) {
            return attachChildrenMutation.error.detail;
        }

        if (toggleFeatureMutation.error instanceof ApiError) {
            return toggleFeatureMutation.error.detail;
        }

        return "Action failed.";
    }, [
        approveMutation.error,
        rejectMutation.error,
        attachChildrenMutation.error,
        toggleFeatureMutation.error,
    ]);

    const items = (contentQuery.data?.items ?? []) as AdminContentItem[];

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
        <RoleGuard allowedRoles={["ADMIN", "MODERATOR"]}>
            <div className="space-y-8">
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                        Admin Content
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                        Manage all platform content
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                        Review submissions, open content in a readable preview, approve or reject,
                        and place published children’s content into the age-grouped children library.
                    </p>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                    <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search title, slug, excerpt, body..."
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value as ContentStatus | "")
                            }
                            className="rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        >
                            {statusOptions.map((status) => (
                                <option
                                    className="bg-[#111113] text-white"
                                    key={status || "ALL"}
                                    value={status}
                                >
                                    {status || "All statuses"}
                                </option>
                            ))}
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(event) =>
                                setTypeFilter(event.target.value as ContentType | "")
                            }
                            className="rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        >
                            {contentTypeOptions.map((type) => (
                                <option
                                    className="bg-[#111113] text-white"
                                    key={type || "ALL"}
                                    value={type}
                                >
                                    {type || "All types"}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {contentQuery.isLoading ? (
                    <LoadingState label="Loading platform content..." />
                ) : null}

                {contentQuery.isError ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        Could not load admin content.
                    </div>
                ) : null}

                {approveMutation.isError ||
                    rejectMutation.isError ||
                    attachChildrenMutation.isError ||
                    toggleFeatureMutation.isError ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {mutationError}
                    </div>
                ) : null}

                {attachChildrenMutation.isSuccess ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        Content added to children’s library.
                    </div>
                ) : null}

                {items.length > 0 ? (
                    <section className="space-y-4">
                        {items.map((content) => {
                            const selectedAgeGroup =
                                ageGroupByContentId[content.id] ?? "AGE_6_9";

                            const canAttachToChildren =
                                content.content_type === "CHILDREN" &&
                                content.status === "PUBLISHED";

                            return (
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

                                        {content.status === "PUBLISHED" ? (
                                            <Link
                                                href={`/read/${content.slug}`}
                                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
                                            >
                                                Open public page
                                            </Link>
                                        ) : null}

                                        {content.status === "PENDING_REVIEW" ? (
                                            <button
                                                type="button"
                                                onClick={() => approveMutation.mutate(content.id)}
                                                disabled={approveMutation.isPending}
                                                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                                            >
                                                Approve
                                            </button>
                                        ) : null}

                                        {content.status === "PENDING_REVIEW" ? (
                                            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                                                <input
                                                    value={rejectReasonById[content.id] ?? ""}
                                                    onChange={(event) =>
                                                        setRejectReasonById((current) => ({
                                                            ...current,
                                                            [content.id]: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="Rejection reason..."
                                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
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
                                                    className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 disabled:opacity-60"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : null}

                                        <button
                                            type="button"
                                            onClick={() => toggleFeatureMutation.mutate(content.id)}
                                            disabled={toggleFeatureMutation.isPending}
                                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${content.is_featured
                                                ? "border border-amber-300/40 bg-gradient-to-r from-amber-300 to-orange-400 text-black"
                                                : "border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 text-white"
                                                }`}
                                        >
                                            {toggleFeatureMutation.isPending
                                                ? "Updating..."
                                                : content.is_featured
                                                    ? "Featured"
                                                    : "Make featured"}
                                        </button>

                                        {content.content_type === "CHILDREN" ? (
                                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-white">
                                                            Children’s library
                                                        </h3>
                                                        <p className="mt-1 text-xs leading-5 text-white/45">
                                                            Published CHILDREN content can be added to the curated
                                                            age-grouped children’s space.
                                                        </p>
                                                    </div>

                                                    <div className="grid gap-2 sm:grid-cols-[180px_auto]">
                                                        <select
                                                            value={selectedAgeGroup}
                                                            onChange={(event) =>
                                                                setAgeGroupByContentId((current) => ({
                                                                    ...current,
                                                                    [content.id]: event.target.value as ChildrenAgeGroup,
                                                                }))
                                                            }
                                                            disabled={!canAttachToChildren}
                                                            className="rounded-2xl border border-white/10 bg-[#111113] px-4 py-2 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {ageGroupOptions.map((option) => (
                                                                <option
                                                                    className="bg-[#111113] text-white"
                                                                    key={option}
                                                                    value={option}
                                                                >
                                                                    {ageGroupLabels[option]}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                attachChildrenMutation.mutate({
                                                                    contentId: content.id,
                                                                    ageGroup: selectedAgeGroup,
                                                                })
                                                            }
                                                            disabled={
                                                                !canAttachToChildren || attachChildrenMutation.isPending
                                                            }
                                                            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {attachChildrenMutation.isPending
                                                                ? "Saving..."
                                                                : "Add to children"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {!canAttachToChildren ? (
                                                    <p className="mt-3 text-xs text-amber-200/80">
                                                        This action is enabled only after the CHILDREN content is
                                                        published.
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                ) : null}

                {contentQuery.data && items.length === 0 ? (
                    <EmptyState
                        title="No content found"
                        description="Try changing the filters or create content from the writer studio."
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
                                        Preview
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
                                                <h3 className="text-sm font-semibold text-white">Attachments</h3>
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
                                                {selectedContent.status === "PENDING_REVIEW" ? (
                                                    <>
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
                                                    </>
                                                ) : null}

                                                {selectedContent.status === "PUBLISHED" ? (
                                                    <Link
                                                        href={`/read/${selectedContent.slug}`}
                                                        className="block w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-black"
                                                    >
                                                        Open public page
                                                    </Link>
                                                ) : null}

                                                {selectedContent.content_type === "CHILDREN" &&
                                                    selectedContent.status === "PUBLISHED" ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            attachChildrenMutation.mutate({
                                                                contentId: selectedContent.id,
                                                                ageGroup: "AGE_6_9",
                                                            })
                                                        }
                                                        disabled={attachChildrenMutation.isPending}
                                                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10 disabled:opacity-60"
                                                    >
                                                        Add to children library
                                                    </button>
                                                ) : null}
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