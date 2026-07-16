"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EditorToolbar from "@/components/editor/EditorToolbar";
import MarkdownPreview from "@/components/editor/MarkdownPreview";
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

const visibilityOptions: ContentVisibility[] = ["PUBLIC", "PARTNERS_ONLY", "PRIVATE"];

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

function countWords(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
}

function countCharacters(text: string) {
    return text.length;
}

function estimateReadingMinutes(text: string) {
    const words = countWords(text);
    return Math.max(1, Math.round(words / 220));
}

type PreviewMode = "write" | "split" | "preview";

export default function PublishPage() {
    const bodyRef = useRef<HTMLTextAreaElement | null>(null);

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
    const [previewMode, setPreviewMode] = useState<PreviewMode>("split");

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: api.categories,
    });

    const hubsQuery = useQuery({
        queryKey: ["hubs"],
        queryFn: api.hubs,
    });

    const computedSlug = useMemo(() => slugify(title), [title]);
    const wordCount = useMemo(() => countWords(body), [body]);
    const charCount = useMemo(() => countCharacters(body), [body]);
    const readingMinutes = useMemo(() => estimateReadingMinutes(body), [body]);

    const createMutation = useMutation({
        mutationFn: api.createContent,
        onSuccess: (content) => {
            setCreatedContentId(content.id);
        },
    });

    const submitMutation = useMutation({
        mutationFn: api.submitContentForReview,
    });

    function handleTitleChange(value: string) {
        setTitle(value);

        if (!slugTouched) {
            setSlug(slugify(value));
        }
    }

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

    const draftSummary = body.trim() || excerpt.trim() || "Your draft summary will appear here.";

    return (
        <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN"]}>
            <div className="mx-auto min-h-screen max-w-[1600px] px-3 py-4 sm:px-6 lg:px-8">
                <section className="overflow-hidden rounded-[1.5rem] border border-border bg-surface sm:rounded-[2rem]">
                    <div className="kanga" />

                    <div className="grid gap-5 p-4 sm:p-8 lg:grid-cols-[1.45fr_0.85fr] lg:items-end">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent sm:px-4 sm:text-xs sm:tracking-[0.22em]">
                                <Sparkles className="h-3.5 w-3.5" />
                                Publishing studio
                            </div>

                            <h1 className="font-display mt-4 font-display text-2xl tracking-tight text-fg sm:text-4xl lg:text-5xl">
                                Create with calm, clarity, and purpose.
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-dim sm:text-base">
                                Write your draft, shape it with the toolbar, then submit it for review when ready.
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
                                <div className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-fg-dim sm:px-4 sm:py-3 sm:text-sm">
                                    <span className="text-fg-dim">Reading time</span>{" "}
                                    <span className="ml-1 font-semibold text-fg">{readingMinutes} min</span>
                                </div>

                                <div className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-fg-dim sm:px-4 sm:py-3 sm:text-sm">
                                    <span className="text-fg-dim">Words</span>{" "}
                                    <span className="ml-1 font-semibold text-fg">{wordCount}</span>
                                </div>

                                <div className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-fg-dim sm:px-4 sm:py-3 sm:text-sm">
                                    <span className="text-fg-dim">Characters</span>{" "}
                                    <span className="ml-1 font-semibold text-fg">{charCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4 backdrop-blur sm:rounded-[1.75rem] sm:p-5">
                            <div className="flex items-center gap-3">
                                <Save className="h-5 w-5 text-fg-dim" />
                                <h2 className="font-display font-semibold text-fg">Writing rhythm</h2>
                            </div>

                            <div className="mt-4 space-y-3 text-sm text-fg-dim">
                                <p>• Keep the title, slug, and excerpt concise</p>
                                <p>• Use the toolbar to shape the body without leaving the page</p>
                                <p>• Switch to preview only when checking polish</p>
                                <p>• Submit after the draft feels structurally complete</p>
                            </div>
                        </div>
                    </div>
                </section>

                <form
                    onSubmit={handleCreate}
                    className="mt-5 grid w-full max-w-full gap-5 overflow-x-hidden xl:grid-cols-[1.35fr_0.65fr] sm:mt-6 sm:gap-6"
                >
                    <div className="min-w-0 space-y-5 sm:space-y-6">
                        <div className="rounded-[1.5rem] border border-border bg-surface p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:rounded-[2rem] sm:p-6">
                            <div className="grid gap-5">
                                <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:p-5">
                                    <label className="text-sm text-fg-dim">Title</label>
                                    <input
                                        value={title}
                                        onChange={(event) => handleTitleChange(event.target.value)}
                                        className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40"
                                        placeholder="A compelling title"
                                        required
                                    />
                                </div>

                                <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <label className="text-sm text-fg-dim">Slug</label>
                                        <button
                                            type="button"
                                            onClick={() => setSlug(slugify(title))}
                                            className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-dim hover:bg-surface-2 hover:text-fg"
                                        >
                                            Auto-fill
                                        </button>
                                    </div>

                                    <input
                                        value={slug}
                                        onChange={(event) => {
                                            setSlugTouched(true);
                                            setSlug(slugify(event.target.value));
                                        }}
                                        className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40"
                                        placeholder="your-clean-url-slug"
                                        required
                                    />

                                    <p className="mt-2 break-words text-xs text-fg-dim">
                                        Public URL preview:{" "}
                                        <span className="break-all text-fg-dim">
                                            /read/{slug || computedSlug || "slug"}
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:p-5">
                                    <label className="text-sm text-fg-dim">Excerpt</label>
                                    <textarea
                                        value={excerpt}
                                        onChange={(event) => setExcerpt(event.target.value)}
                                        rows={4}
                                        className="mt-2 w-full min-w-0 resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40"
                                        placeholder="A short summary readers can scan quickly."
                                    />

                                    <p className="mt-2 text-xs text-fg-dim">
                                        Keep it crisp. It should help the reader decide whether to open the piece.
                                    </p>
                                </div>

                                <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                        <div className="min-w-0">
                                            <label className="text-sm text-fg-dim">Body</label>
                                            <p className="mt-1 text-xs text-fg-dim">
                                                The editor is kept inside the phone width and will scroll safely if content is long.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewMode("write")}
                                                className={`rounded-xl px-3 py-2 text-xs transition ${previewMode === "write"
                                                    ? "bg-accent text-on-accent"
                                                    : "border border-border bg-surface text-fg-dim"
                                                    }`}
                                            >
                                                Write
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPreviewMode("split")}
                                                className={`rounded-xl px-3 py-2 text-xs transition ${previewMode === "split"
                                                    ? "bg-accent text-on-accent"
                                                    : "border border-border bg-surface text-fg-dim"
                                                    }`}
                                            >
                                                Split
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPreviewMode("preview")}
                                                className={`rounded-xl px-3 py-2 text-xs transition ${previewMode === "preview"
                                                    ? "bg-accent text-on-accent"
                                                    : "border border-border bg-surface text-fg-dim"
                                                    }`}
                                            >
                                                Preview
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 w-full max-w-full overflow-x-auto pb-1">
                                        <div className="min-w-max">
                                            <EditorToolbar textareaRef={bodyRef} value={body} onChange={setBody} />
                                        </div>
                                    </div>

                                    <div
                                        className={`mt-5 grid w-full max-w-full min-w-0 gap-4 ${previewMode === "split" ? "xl:grid-cols-[1.15fr_0.85fr]" : ""
                                            }`}
                                    >
                                        {previewMode !== "preview" ? (
                                            <textarea
                                                ref={bodyRef}
                                                value={body}
                                                onChange={(event) => setBody(event.target.value)}
                                                rows={18}
                                                className="min-h-[360px] w-full max-w-full min-w-0 resize-y overflow-x-hidden overflow-y-auto rounded-[1.5rem] border border-border bg-surface px-4 py-4 text-sm leading-7 text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40 sm:min-h-[560px] sm:px-5 sm:py-5 md:min-h-[720px] md:resize-none"
                                                placeholder="Write your piece here."
                                                required
                                            />
                                        ) : null}

                                        {previewMode !== "write" ? (
                                            <div className="min-h-[360px] w-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-[1.5rem] border border-border bg-surface p-4 sm:min-h-[560px] sm:p-6 md:min-h-[720px]">
                                                <div className="w-full min-w-0 break-words">
                                                    <MarkdownPreview
                                                        content={body.trim() || "# Live preview\n\nYour formatted content appears here."}
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-fg-dim">
                                        <span className="rounded-full border border-border bg-surface px-3 py-1">
                                            {wordCount} words
                                        </span>
                                        <span className="rounded-full border border-border bg-surface px-3 py-1">
                                            {readingMinutes} min read
                                        </span>
                                        <span className="rounded-full border border-border bg-surface px-3 py-1">
                                            {charCount} characters
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="min-w-0 space-y-5 lg:sticky lg:top-6 lg:self-start sm:space-y-6">
                        <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:rounded-[2rem] sm:p-5">
                            <h2 className="font-display text-lg font-semibold text-fg">Settings</h2>

                            <div className="mt-5 grid gap-4">
                                <div>
                                    <label className="text-sm text-fg-dim">Content type</label>
                                    <select
                                        value={contentType}
                                        onChange={(event) => setContentType(event.target.value as ContentType)}
                                        className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent/40"
                                    >
                                        {contentTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-fg-dim">Visibility</label>
                                    <select
                                        value={visibility}
                                        onChange={(event) => setVisibility(event.target.value as ContentVisibility)}
                                        className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent/40"
                                    >
                                        {visibilityOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                                    <div className="min-w-0">
                                        <label className="text-sm text-fg-dim">Category</label>
                                        <select
                                            value={categoryId}
                                            onChange={(event) => setCategoryId(event.target.value)}
                                            className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent/40"
                                        >
                                            <option value="">No category</option>
                                            {categoriesQuery.data?.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="min-w-0">
                                        <label className="text-sm text-fg-dim">Hub</label>
                                        <select
                                            value={hubId}
                                            onChange={(event) => setHubId(event.target.value)}
                                            className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition focus:border-accent/40"
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

                                <label className="flex min-w-0 items-start gap-3 rounded-[1.5rem] border border-border bg-surface px-4 py-4 text-sm text-fg-dim">
                                    <input
                                        type="checkbox"
                                        checked={isPremium}
                                        onChange={(event) => setIsPremium(event.target.checked)}
                                        className="mt-1 shrink-0"
                                    />
                                    <span className="min-w-0">
                                        <span className="block font-medium text-fg">
                                            Mark as partner-only / premium content
                                        </span>
                                        <span className="mt-1 block break-words text-xs leading-5 text-fg-dim">
                                            Use this for exclusive or partnership-supported material.
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:rounded-[2rem] sm:p-5">
                            <h3 className="font-display text-sm font-semibold text-fg">Draft snapshot</h3>

                            <div className="mt-4 rounded-[1.5rem] border border-border bg-surface p-4">
                                <p className="break-words text-xs uppercase tracking-[0.2em] text-fg-dim">
                                    {contentType} • {visibility}
                                </p>
                                <h4 className="mt-3 break-words text-xl font-semibold text-fg">
                                    {title || "Untitled draft"}
                                </h4>
                                <p className="mt-3 line-clamp-4 break-words text-sm leading-6 text-fg-dim">
                                    {draftSummary}
                                </p>
                            </div>
                        </div>

                        {createMutation.isError ? (
                            <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                                {createError}
                            </p>
                        ) : null}

                        {createMutation.isSuccess ? (
                            <div className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
                                Draft created successfully.
                            </div>
                        ) : null}

                        {submitMutation.isError ? (
                            <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                                {submitError}
                            </p>
                        ) : null}

                        {submitMutation.isSuccess ? (
                            <p className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
                                Content submitted for review.
                            </p>
                        ) : null}

                        <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:rounded-[2rem] sm:p-5">
                            <div className="flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {createMutation.isPending ? "Creating..." : "Create draft"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmitForReview}
                                    disabled={!createdContentId || submitMutation.isPending}
                                    className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-fg-dim transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {submitMutation.isPending ? "Submitting..." : "Submit for review"}
                                </button>
                            </div>
                        </div>
                    </aside>
                </form>
            </div>
        </RoleGuard>
    );
}