"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type {
    ChildrenAgeGroup,
    ContentStatus,
    ContentType,
} from "@/lib/types";

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
    "POEM",
    "FAITH",
    "EDUCATION",
    "CHILDREN",
    "NEWS",
    "AUDIO",
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
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ contentId, reason }: { contentId: string; reason: string }) =>
            api.rejectContent(contentId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "content"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
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

    const items = contentQuery.data?.items ?? [];

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
                        Review submissions, publish approved content, reject unsafe content,
                        and place published children’s content into the age-grouped children
                        library.
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
                            const selectedAgeGroup = ageGroupByContentId[content.id] ?? "AGE_6_9";

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

                                    <div className="mt-5 flex flex-col gap-4">
                                        <div className="flex flex-wrap gap-2">
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
                                        </div>

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
                                                ? "border border-amber-300/40 bg-gradient-to-r from-amber-300 to-orange-400 text-black shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_10px_30px_rgba(251,191,36,0.25)]"
                                                : "border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 text-white shadow-[0_0_0_1px_rgba(217,70,239,0.18)] hover:from-fuchsia-500/30 hover:to-cyan-500/30 hover:text-white"
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
        </RoleGuard>
    );
}