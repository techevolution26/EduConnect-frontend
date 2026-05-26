"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import RoleGuard from "@/components/auth/RoleGuard";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import type { ContentStatus, ContentType, ContentVisibility } from "@/lib/types";

const contentTypes: ContentType[] = [
    "ARTICLE",
    "STORY",
    "POEM",
    "FAITH",
    "EDUCATION",
    "CHILDREN",
    "NEWS",
    "AUDIO",
];

const visibilityOptions: ContentVisibility[] = [
    "PUBLIC",
    "PARTNERS_ONLY",
    "PRIVATE",
];

function canEdit(status: ContentStatus) {
    return status === "DRAFT" || status === "REJECTED";
}

function canSubmit(status: ContentStatus) {
    return status === "DRAFT" || status === "REJECTED";
}

function statusClass(status: ContentStatus) {
    const map: Record<ContentStatus, string> = {
        DRAFT: "bg-white/10 text-white/70",
        PENDING_REVIEW: "bg-amber-500/10 text-amber-200",
        PUBLISHED: "bg-emerald-500/10 text-emerald-200",
        REJECTED: "bg-red-500/10 text-red-200",
        ARCHIVED: "bg-zinc-500/10 text-zinc-200",
    };

    return map[status];
}

export default function WriterContentEditPage() {
    const params = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const contentId = params.id;

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [body, setBody] = useState("");
    const [contentType, setContentType] = useState<ContentType>("ARTICLE");
    const [visibility, setVisibility] = useState<ContentVisibility>("PUBLIC");
    const [isPremium, setIsPremium] = useState(false);
    const [categoryId, setCategoryId] = useState("");
    const [hubId, setHubId] = useState("");

    const contentQuery = useQuery({
        queryKey: ["writer", "content", contentId],
        queryFn: () => api.myContentDetail(contentId),
        enabled: Boolean(contentId),
    });

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: api.categories,
    });

    const hubsQuery = useQuery({
        queryKey: ["hubs"],
        queryFn: api.hubs,
    });

    const moderationQuery = useQuery({
        queryKey: ["writer", "content", contentId, "moderation"],
        queryFn: () => api.contentModerationLogs(contentId),
        enabled: Boolean(contentId),
    });

    useEffect(() => {
        const content = contentQuery.data;

        if (!content) return;

        // Batch state updates to avoid cascading renders
        Promise.resolve().then(() => {
            setTitle(content.title ?? "");
            setSlug(content.slug ?? "");
            setExcerpt(content.excerpt ?? "");
            setBody(content.body ?? "");
            setContentType(content.content_type);
            setVisibility(content.visibility);
            setIsPremium(content.is_premium);
            setCategoryId(content.category_id ?? "");
            setHubId(content.hub_id ?? "");
        });
    }, [contentQuery.data]);

    const editable = contentQuery.data ? canEdit(contentQuery.data.status) : false;
    const submittable = contentQuery.data
        ? canSubmit(contentQuery.data.status)
        : false;

    const updateMutation = useMutation({
        mutationFn: () =>
            api.updateContent(contentId, {
                title,
                slug,
                excerpt: excerpt.trim() ? excerpt.trim() : null,
                body,
                content_type: contentType,
                visibility,
                is_premium: isPremium,
                category_id: categoryId || null,
                hub_id: hubId || null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["writer", "content"] });
            queryClient.invalidateQueries({ queryKey: ["writer", "content", contentId] });
        },
    });

    const submitMutation = useMutation({
        mutationFn: () => api.submitContentForReview(contentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["writer", "content"] });
            queryClient.invalidateQueries({ queryKey: ["writer", "content", contentId] });
        },
    });

    function handleTitleChange(value: string) {
        setTitle(value);

        if (!slug) {
            setSlug(slugify(value));
        }
    }

    function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editable) return;

        updateMutation.mutate();
    }

    const actionError = useMemo(() => {
        if (updateMutation.error instanceof ApiError) {
            return updateMutation.error.detail;
        }

        if (submitMutation.error instanceof ApiError) {
            return submitMutation.error.detail;
        }

        return "Action failed.";
    }, [updateMutation.error, submitMutation.error]);

    return (
        <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN"]}>
            <div className="mx-auto max-w-5xl space-y-8">
                {contentQuery.isLoading ? (
                    <LoadingState label="Loading content..." />
                ) : null}

                {contentQuery.isError ? (
                    <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-6 text-red-100">
                        Could not load this content.
                    </div>
                ) : null}

                {contentQuery.data?.status === "REJECTED" ? (
                    <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
                        <h2 className="text-lg font-semibold">Revision required</h2>

                        {moderationQuery.data?.find((log) => log.action === "REJECTED")?.note ? (
                            <p className="mt-3 text-sm leading-6 text-red-100/80">
                                {
                                    moderationQuery.data.find((log) => log.action === "REJECTED")
                                        ?.note
                                }
                            </p>
                        ) : (
                            <p className="mt-3 text-sm leading-6 text-red-100/80">
                                This content was rejected. Please review and update it before
                                resubmitting.
                            </p>
                        )}
                    </section>
                ) : null}

                {contentQuery.data ? (
                    <>
                        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                                        Writer Studio
                                    </p>

                                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                                        Manage content
                                    </h1>

                                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                                        Edit drafts or rejected content, then submit it for review.
                                    </p>
                                </div>

                                <span
                                    className={`w-fit rounded-full px-3 py-1 text-xs ${statusClass(
                                        contentQuery.data?.status ?? "DRAFT",
                                    )}`}
                                >
                                    {contentQuery.data?.status}
                                </span>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/writer/dashboard"
                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
                                >
                                    Back to studio
                                </Link>

                                {contentQuery.data.content_type === "EDUCATION" ? (
                                    <Link
                                        href={`/writer/content/${contentQuery.data.id}/education`}
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
                                    >
                                        Attach education metadata
                                    </Link>
                                ) : null}

                                {contentQuery.data.content_type === "CHILDREN" &&
                                    contentQuery.data.status === "PUBLISHED" ? (
                                    <Link
                                        href={`/writer/content/${contentQuery.data.id}/children`}
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
                                    >
                                        Add to children library
                                    </Link>
                                ) : null}

                                {contentQuery.data?.status === "PUBLISHED" ? (
                                    <Link
                                        href={`/read/${contentQuery.data?.slug}`}
                                        className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
                                    >
                                        Open public page
                                    </Link>
                                ) : null}

                                {submittable ? (
                                    <button
                                        type="button"
                                        onClick={() => submitMutation.mutate()}
                                        disabled={submitMutation.isPending}
                                        className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                                    >
                                        {submitMutation.isPending
                                            ? "Submitting..."
                                            : contentQuery.data?.status === "REJECTED"
                                                ? "Resubmit for review"
                                                : "Submit for review"}
                                    </button>
                                ) : null}
                            </div>
                        </section>

                        {!editable ? (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                This content is currently <strong>{contentQuery.data.status}</strong>.
                                Only draft or rejected content can be edited directly.
                            </div>
                        ) : null}

                        {updateMutation.isError || submitMutation.isError ? (
                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {actionError}
                            </div>
                        ) : null}

                        {updateMutation.isSuccess ? (
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                Changes saved.
                            </div>
                        ) : null}

                        {submitMutation.isSuccess ? (
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                Content submitted for review.
                            </div>
                        ) : null}

                        <form
                            onSubmit={handleSave}
                            className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
                        >
                            <div>
                                <label className="text-sm text-white/70">Title</label>
                                <input
                                    value={title}
                                    onChange={(event) => handleTitleChange(event.target.value)}
                                    disabled={!editable}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/70">Slug</label>
                                <input
                                    value={slug}
                                    onChange={(event) => setSlug(slugify(event.target.value))}
                                    disabled={!editable}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/70">Excerpt</label>
                                <textarea
                                    value={excerpt}
                                    onChange={(event) => setExcerpt(event.target.value)}
                                    disabled={!editable}
                                    rows={3}
                                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/70">Body</label>
                                <textarea
                                    value={body}
                                    onChange={(event) => setBody(event.target.value)}
                                    disabled={!editable}
                                    rows={14}
                                    className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none disabled:opacity-60"
                                    required
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm text-white/70">Content type</label>
                                    <select
                                        value={contentType}
                                        onChange={(event) =>
                                            setContentType(event.target.value as ContentType)
                                        }
                                        disabled={!editable}
                                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                                    >
                                        {contentTypes.map((type) => (
                                            <option className="bg-[#111113] text-white" key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-white/70">Visibility</label>
                                    <select
                                        value={visibility}
                                        onChange={(event) =>
                                            setVisibility(event.target.value as ContentVisibility)
                                        }
                                        disabled={!editable}
                                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                                    >
                                        {visibilityOptions.map((option) => (
                                            <option
                                                className="bg-[#111113] text-white"
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm text-white/70">Category</label>
                                    <select
                                        value={categoryId}
                                        onChange={(event) => setCategoryId(event.target.value)}
                                        disabled={!editable}
                                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                                    >
                                        <option className="bg-[#111113] text-white" value="">
                                            No category
                                        </option>
                                        {categoriesQuery.data?.map((category) => (
                                            <option
                                                className="bg-[#111113] text-white"
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-white/70">Hub</label>
                                    <select
                                        value={hubId}
                                        onChange={(event) => setHubId(event.target.value)}
                                        disabled={!editable}
                                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                                    >
                                        <option className="bg-[#111113] text-white" value="">
                                            No hub
                                        </option>
                                        {hubsQuery.data?.map((hub) => (
                                            <option
                                                className="bg-[#111113] text-white"
                                                key={hub.id}
                                                value={hub.id}
                                            >
                                                {hub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                                <input
                                    type="checkbox"
                                    checked={isPremium}
                                    disabled={!editable}
                                    onChange={(event) => setIsPremium(event.target.checked)}
                                />
                                Mark as partner-only/premium content
                            </label>

                            <button
                                type="submit"
                                disabled={!editable || updateMutation.isPending}
                                className="w-fit rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {updateMutation.isPending ? "Saving..." : "Save changes"}
                            </button>
                        </form>
                    </>
                ) : null}
            </div>
        </RoleGuard>
    );
}