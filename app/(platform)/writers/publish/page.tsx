"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import { api, ApiError } from "@/lib/api";
import type { ContentType, ContentVisibility } from "@/lib/types";

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

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

export default function PublishPage() {
    const [title, setTitle] = useState("");
    const [slugTouched, setSlugTouched] = useState(false);
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [body, setBody] = useState("");
    const [contentType, setContentType] = useState<ContentType>("ARTICLE");
    const [visibility, setVisibility] = useState<ContentVisibility>("PUBLIC");
    const [isPremium, setIsPremium] = useState(false);
    const [categoryId, setCategoryId] = useState("");
    const [hubId, setHubId] = useState("");
    const [createdContentId, setCreatedContentId] = useState<string | null>(null);

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: api.categories,
    });

    const hubsQuery = useQuery({
        queryKey: ["hubs"],
        queryFn: api.hubs,
    });

    const computedSlug = useMemo(() => slugify(title), [title]);

    function handleTitleChange(value: string) {
        setTitle(value);

        if (!slugTouched) {
            setSlug(slugify(value));
        }
    }

    const createMutation = useMutation({
        mutationFn: api.createContent,
        onSuccess: (content) => {
            setCreatedContentId(content.id);
        },
    });

    const submitMutation = useMutation({
        mutationFn: api.submitContentForReview,
    });

    function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        createMutation.mutate({
            title,
            slug: slug || computedSlug,
            excerpt: excerpt || undefined,
            body,
            content_type: contentType,
            visibility,
            is_premium: isPremium,
            category_id: categoryId || undefined,
            hub_id: hubId || undefined,
        });
    }

    function handleSubmitForReview() {
        if (!createdContentId) return;
        submitMutation.mutate(createdContentId);
    }

    const createError =
        createMutation.error instanceof ApiError
            ? createMutation.error.detail
            : "Could not create content.";

    const submitError =
        submitMutation.error instanceof ApiError
            ? submitMutation.error.detail
            : "Could not submit content.";

    return (
        <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN"]}>
            <div className="mx-auto max-w-5xl space-y-8">
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                        Publish
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                        Create content
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                        Create a draft, then submit it for moderation review.
                    </p>
                </section>

                <form
                    onSubmit={handleCreate}
                    className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
                >
                    <div>
                        <label className="text-sm text-white/70">Title</label>
                        <input
                            value={title}
                            onChange={(event) => handleTitleChange(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm text-white/70">Slug</label>
                        <input
                            value={slug}
                            onChange={(event) => {
                                setSlugTouched(true);
                                setSlug(slugify(event.target.value));
                            }}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm text-white/70">Excerpt</label>
                        <textarea
                            value={excerpt}
                            onChange={(event) => setExcerpt(event.target.value)}
                            rows={3}
                            className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-white/30"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-white/70">Body</label>
                        <textarea
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            rows={12}
                            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-white/30"
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
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                            >
                                {contentTypes.map((type) => (
                                    <option key={type} value={type}>
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
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                            >
                                {visibilityOptions.map((option) => (
                                    <option key={option} value={option}>
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
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                            >
                                <option value="">No category</option>
                                {categoriesQuery.data?.map((category) => (
                                    <option key={category.id} value={category.id}>
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
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                            >
                                <option value="">No hub</option>
                                {hubsQuery.data?.map((hub) => (
                                    <option key={hub.id} value={hub.id}>
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
                            onChange={(event) => setIsPremium(event.target.checked)}
                        />
                        Mark as partner-only/premium content
                    </label>

                    {createMutation.isError ? (
                        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {createError}
                        </p>
                    ) : null}

                    {createMutation.isSuccess ? (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            Draft created successfully.
                        </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                        >
                            {createMutation.isPending ? "Creating..." : "Create draft"}
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmitForReview}
                            disabled={!createdContentId || submitMutation.isPending}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {submitMutation.isPending
                                ? "Submitting..."
                                : "Submit for review"}
                        </button>
                    </div>

                    {submitMutation.isError ? (
                        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {submitError}
                        </p>
                    ) : null}

                    {submitMutation.isSuccess ? (
                        <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            Content submitted for review.
                        </p>
                    ) : null}
                </form>
            </div>
        </RoleGuard>
    );
}