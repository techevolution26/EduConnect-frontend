"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import RoleGuard from "@/components/auth/RoleGuard";
import EditorToolbar from "@/components/editor/EditorToolbar";
import MarkdownPreview from "@/components/editor/MarkdownPreview";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import type {
  ContentStatus,
  ContentType,
  ContentVisibility,
} from "@/lib/types";

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

type ContentDraft = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  content_type: ContentType;
  visibility: ContentVisibility;
  is_premium: boolean;
  category_id: string | null;
  hub_id: string | null;
  status: ContentStatus;
};

type Props = {
  content: ContentDraft;
  contentId: string;
  onSaved: () => void;
  onSubmitted: () => void;
  categories: { id: string; name: string }[];
  hubs: { id: string; name: string }[];
  moderationNote?: string | null;
};

function WriterContentEditor({
  content,
  contentId,
  onSaved,
  onSubmitted,
  categories,
  hubs,
  moderationNote,
}: Props) {
  const queryClient = useQueryClient();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState(content.title ?? "");
  const [slug, setSlug] = useState(content.slug ?? "");
  const [excerpt, setExcerpt] = useState(content.excerpt ?? "");
  const [body, setBody] = useState(content.body ?? "");
  const [contentType, setContentType] = useState<ContentType>(content.content_type);
  const [visibility, setVisibility] = useState<ContentVisibility>(content.visibility);
  const [isPremium, setIsPremium] = useState(content.is_premium);
  const [categoryId, setCategoryId] = useState(content.category_id ?? "");
  const [hubId, setHubId] = useState(content.hub_id ?? "");
  const [previewMode, setPreviewMode] = useState<"write" | "split" | "preview">("split");

  const editable = canEdit(content.status);
  const submittable = canSubmit(content.status);

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
      onSaved();
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitContentForReview(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["writer", "content"] });
      queryClient.invalidateQueries({ queryKey: ["writer", "content", contentId] });
      onSubmitted();
    },
  });

  const actionError =
    updateMutation.error instanceof ApiError
      ? updateMutation.error.detail
      : submitMutation.error instanceof ApiError
        ? submitMutation.error.detail
        : "Action failed.";

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slug) {
      setSlug(slugify(value));
    }
  }

  function updateBody(nextValue: string, cursor?: number) {
    setBody(nextValue);

    if (typeof cursor !== "number") return;

    requestAnimationFrame(() => {
      const textarea = bodyRef.current;
      if (!textarea) return;

      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertAtCursor(prefix: string, suffix = "") {
    const textarea = bodyRef.current;

    if (!textarea) {
      setBody((current) => `${current}${prefix}${suffix}`);
      return;
    }

    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? body.length;
    const selected = body.slice(start, end);

    const nextValue =
      body.slice(0, start) + prefix + selected + suffix + body.slice(end);

    const cursor = start + prefix.length + selected.length + suffix.length;
    updateBody(nextValue, cursor);
  }

  function insertLine(prefix: string) {
    const textarea = bodyRef.current;

    if (!textarea) {
      setBody((current) => `${current}\n${prefix}`);
      return;
    }

    const start = textarea.selectionStart ?? body.length;
    const nextValue = body.slice(0, start) + prefix + body.slice(start);
    const cursor = start + prefix.length;

    updateBody(nextValue, cursor);
  }

  const livePreview =
    body.trim() || excerpt.trim() || "Your draft preview will appear here.";

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editable) return;

    updateMutation.mutate();
  }

  return (
    <div className="space-y-8">
      {content.status === "REJECTED" ? (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
          <h2 className="text-lg font-semibold">Revision required</h2>

          {moderationNote ? (
            <p className="mt-3 text-sm leading-6 text-red-100/80">{moderationNote}</p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-red-100/80">
              This content was rejected. Please review and update it before resubmitting.
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">
              Writer Studio
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Manage content</h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
              Edit drafts or rejected content, then submit it for review.
            </p>
          </div>

          <span className={`w-fit rounded-full px-3 py-1 text-xs ${statusClass(content.status)}`}>
            {content.status}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/writer/dashboard"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
          >
            Back to studio
          </Link>

          {content.content_type === "EDUCATION" ? (
            <Link
              href={`/writer/content/${content.id}/education`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
            >
              Attach education metadata
            </Link>
          ) : null}

          {content.content_type === "CHILDREN" && content.status === "PUBLISHED" ? (
            <Link
              href={`/writer/content/${content.id}/children`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
            >
              Add to children library
            </Link>
          ) : null}

          {content.status === "PUBLISHED" ? (
            <Link
              href={`/read/${content.slug}`}
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
                : content.status === "REJECTED"
                  ? "Resubmit for review"
                  : "Submit for review"}
            </button>
          ) : null}
        </div>
      </section>

      {!editable ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          This content is currently <strong>{content.status}</strong>. Only draft or
          rejected content can be edited directly.
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
        className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <label className="text-sm text-white/70">Title</label>
            <input
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              disabled={!editable}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
              required
            />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm text-white/70">Slug</label>
              <button
                type="button"
                onClick={() => setSlug(slugify(title))}
                disabled={!editable}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                Auto-fill
              </button>
            </div>

            <input
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              disabled={!editable}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
              required
            />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <label className="text-sm text-white/70">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              disabled={!editable}
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none disabled:opacity-60"
            />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <label className="text-sm text-white/70">Body</label>
                <p className="mt-1 text-xs text-white/35">
                  Use the toolbar to shape the draft and keep the writing flow simple.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode("write")}
                  className={`rounded-xl px-3 py-2 text-xs transition ${
                    previewMode === "write"
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  Write
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewMode("split")}
                  className={`rounded-xl px-3 py-2 text-xs transition ${
                    previewMode === "split"
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  Split
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewMode("preview")}
                  className={`rounded-xl px-3 py-2 text-xs transition ${
                    previewMode === "preview"
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            <div className="mt-4">
              <EditorToolbar
                textareaRef={bodyRef}
                value={body}
                onChange={setBody}
                disabled={!editable}
              />
            </div>

            <div
              className={`mt-5 grid gap-5 ${
                previewMode === "split" ? "lg:grid-cols-2" : ""
              }`}
            >
              {previewMode !== "preview" ? (
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  disabled={!editable}
                  rows={20}
                  className="min-h-[700px] w-full resize-none rounded-[1.75rem] border border-white/10 bg-[#0d1016] px-5 py-5 text-sm leading-8 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-60"
                  placeholder="Write your piece here..."
                />
              ) : null}

              {previewMode !== "write" ? (
                <div className="min-h-[700px] overflow-auto rounded-[1.75rem] border border-white/10 bg-[#0d1016] p-6">
                  <MarkdownPreview
                    content={
                      body.trim() ||
                      "# Live preview\n\nYour formatted content appears here."
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <h2 className="text-lg font-semibold text-white">Settings</h2>

            <div className="mt-5 grid gap-4">
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
                    <option className="bg-[#111113] text-white" key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
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
                    {categories.map((category) => (
                      <option className="bg-[#111113] text-white" key={category.id} value={category.id}>
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
                    {hubs.map((hub) => (
                      <option className="bg-[#111113] text-white" key={hub.id} value={hub.id}>
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
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <h3 className="text-sm font-semibold text-white">Live preview</h3>
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                {contentType} • {visibility}
              </p>
              <h4 className="mt-3 text-xl font-semibold text-white">
                {title || "Untitled draft"}
              </h4>

              <div className="prose prose-invert mt-4 max-w-none prose-headings:text-white prose-p:text-white/75 prose-strong:text-white prose-code:text-amber-300">
                <MarkdownPreview
                  content={
                    body.trim() ||
                    excerpt.trim() ||
                    "Your draft preview will appear here."
                  }
                />
              </div>
            </div>
          </div>

          {updateMutation.isError || submitMutation.isError ? (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {actionError}
            </p>
          ) : null}

          {updateMutation.isSuccess ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Changes saved.
            </div>
          ) : null}

          {submitMutation.isSuccess ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Content submitted for review.
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!editable || updateMutation.isPending}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function WriterContentEditPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const contentId = params.id;

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

  const moderationNote = useMemo(() => {
    return (
      moderationQuery.data?.find((log) => log.action === "REJECTED")?.note ?? null
    );
  }, [moderationQuery.data]);

  return (
    <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN"]}>
      <div className="mx-auto max-w-6xl space-y-8 pb-10">
        {contentQuery.isLoading ? <LoadingState label="Loading content..." /> : null}

        {contentQuery.isError ? (
          <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-6 text-red-100">
            Could not load this content.
          </div>
        ) : null}

        {contentQuery.data ? (
          <WriterContentEditor
            key={contentQuery.data.id}
            content={contentQuery.data}
            contentId={contentId}
            categories={categoriesQuery.data ?? []}
            hubs={hubsQuery.data ?? []}
            moderationNote={moderationNote}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ["writer", "content"] });
              queryClient.invalidateQueries({ queryKey: ["writer", "content", contentId] });
            }}
            onSubmitted={() => {
              queryClient.invalidateQueries({ queryKey: ["writer", "content"] });
              queryClient.invalidateQueries({ queryKey: ["writer", "content", contentId] });
            }}
          />
        ) : null}
      </div>
    </RoleGuard>
  );
}