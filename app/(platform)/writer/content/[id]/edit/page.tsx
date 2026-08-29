"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Sparkles } from "lucide-react";
import { useMemo, useRef, type FormEvent } from "react";
import { useParams } from "next/navigation";

import RoleGuard from "@/components/auth/RoleGuard";
import EditorToolbar from "@/components/editor/EditorToolbar";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type {
  ContentStatus,
  ContentType,
  ContentVisibility,
} from "@/lib/types";

import { AccordionPanel } from "@/components/editor/AccordionPanel";
import { LabeledSelect } from "@/components/editor/LabeledSelect";
import { FileDropField } from "@/components/editor/FileDropField";
import { DraftSnapshot } from "@/components/editor/DraftSnapshot";
import { EditModeStatusBar } from "@/components/editor/EditModeStatusBar";
import { useAccordionGroup } from "@/hooks/useAccordionGroup";
import { useSlugField } from "@/hooks/useSlugField";
import { useFileSelection } from "@/hooks/useFileSelection";
import { useContentForm } from "@/hooks/useContentForm";

// ─── Static option lists ──────────────────────────────────────────────────────

const contentTypes: ContentType[] = [
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

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentDraft = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  content_type: string;
  visibility: ContentVisibility;
  is_premium: boolean;
  category_id: string | null;
  hub_id: string | null;
  status: ContentStatus;
  updated_at?: string;
};

// ─── Editor (inner component, receives hydrated content) ──────────────────────

function WriterContentEditor({
  content,
  contentId,
  onSaved,
  onSubmitted,
  categories,
  hubs,
  moderationNote,
}: {
  content: ContentDraft;
  contentId: string;
  onSaved: () => void;
  onSubmitted: () => void;
  categories: { id: string; name: string }[];
  hubs: { id: string; name: string }[];
  moderationNote?: string | null;
}) {
  const queryClient = useQueryClient();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const editable = canEdit(content.status);
  const submittable = canSubmit(content.status);

  // ── Shared primitives from ADR-1, seeded with server data ──────────────
  const accordion = useAccordionGroup([
    "title",
    "attachments",
    "settings",
  ] as const);

  const form = useContentForm(
    {
      title: content.title ?? "",
      excerpt: content.excerpt ?? "",
      body: content.body ?? "",
      contentType: content.content_type as ContentType,
      visibility: content.visibility,
      isPremium: content.is_premium,
      categoryId: content.category_id ?? "",
      hubId: content.hub_id ?? "",
    },
    content.updated_at, // same-entity resync trigger
    content.id, // entity-change trigger — always wins over dirty state
  );

  // Edit mode: slug starts "touched" so editing the title never silently
  // rewrites an already-public URL.
  const slugField = useSlugField(form.values.title, content.slug ?? "");

  const imageSelection = useFileSelection();
  const fileSelection = useFileSelection();

  const wordCount = useMemo(
    () => countWords(form.values.body),
    [form.values.body],
  );
  const readingMinutes = Math.max(1, Math.round(wordCount / 220));
  const charCount = form.values.body.length;

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateContent(contentId, {
        title: form.values.title,
        slug: slugField.finalSlug,
        excerpt: form.values.excerpt.trim() ? form.values.excerpt.trim() : null,
        body: form.values.body,
        content_type: form.values.contentType,
        visibility: form.values.visibility,
        is_premium: form.values.isPremium,
        category_id: form.values.categoryId || null,
        hub_id: form.values.hubId || null,
      }),
    onSuccess: () => {
      form.markClean();
      queryClient.invalidateQueries({ queryKey: ["writer", "content"] });
      queryClient.invalidateQueries({
        queryKey: ["writer", "content", contentId],
      });
      onSaved();
    },
  });

  const uploadAssetsMutation = useMutation({
    mutationFn: ({ images, files }: { images: File[]; files: File[] }) =>
      api.uploadContentAssets(contentId, { images, files }),
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitContentForReview(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["writer", "content"] });
      queryClient.invalidateQueries({
        queryKey: ["writer", "content", contentId],
      });
      onSubmitted();
    },
  });

  const actionError =
    updateMutation.error instanceof ApiError
      ? updateMutation.error.detail
      : uploadAssetsMutation.error instanceof ApiError
        ? uploadAssetsMutation.error.detail
        : submitMutation.error instanceof ApiError
          ? submitMutation.error.detail
          : "Action failed.";

  // ── Save: update, then attempt upload (retryable via the upload-error banner) ──

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable) return;

    await updateMutation.mutateAsync();

    if (imageSelection.files.length > 0 || fileSelection.files.length > 0) {
      try {
        await uploadAssetsMutation.mutateAsync({
          images: imageSelection.files,
          files: fileSelection.files,
        });
        imageSelection.clear();
        fileSelection.clear();
      } catch {
        // Swallow — uploadAssetsMutation.isError drives the retry banner below.
        // The files remain selected so retrying the form submit re-attempts upload
        // without re-sending an unnecessary duplicate "update" (update is idempotent
        // here, unlike create, so a second submit is safe).
      }
    }
  }

  const submitLabel = submitMutation.isSuccess
    ? "Submitted for review"
    : submitMutation.isPending
      ? "Submitting…"
      : content.status === "REJECTED"
        ? "Resubmit for review"
        : "Submit for review";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 overflow-x-hidden">
      <EditModeStatusBar
        status={content.status}
        contentType={content.content_type}
        contentId={content.id}
        slug={content.slug}
        moderationNote={moderationNote}
        submittable={submittable}
        isSubmitting={submitMutation.isPending}
        submitLabel={submitLabel}
        onSubmit={() => submitMutation.mutate()}
      />

      {!editable ? (
        <div className="rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-text">
          This content is currently <strong>{content.status}</strong>. Only
          draft or rejected content can be edited directly.
        </div>
      ) : null}

      {updateMutation.isError ||
      uploadAssetsMutation.isError ||
      submitMutation.isError ? (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {actionError}
          {uploadAssetsMutation.isError &&
          (imageSelection.files.length > 0 ||
            fileSelection.files.length > 0) ? (
            <p className="mt-2 text-xs text-danger">
              Your selected files are still attached — submit the form again to
              retry the upload.
            </p>
          ) : null}
        </div>
      ) : null}

      {updateMutation.isSuccess ? (
        <div className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          Changes saved.
        </div>
      ) : null}

      {submitMutation.isSuccess ? (
        <div className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          Content submitted for review.
        </div>
      ) : null}

      <form
        onSubmit={handleSave}
        className="grid gap-6 rounded-[2rem] border border-border bg-surface p-5 2xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
      >
        {/* Main column */}
        <div className="min-w-0 space-y-5">
          <div className="rounded-[2rem] border border-border bg-surface-2 p-5">
            <AccordionPanel
              panelRef={accordion.refFor("title")}
              title="Title, slug & excerpt"
              isOpen={accordion.isOpen("title")}
              onToggle={() => accordion.toggle("title")}
            >
              <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4">
                <label className="text-sm text-fg-dim">Title</label>
                <input
                  value={form.values.title}
                  onChange={(e) => form.set("title", e.target.value)}
                  disabled={!editable}
                  className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none disabled:opacity-60"
                  required
                />
              </div>

              <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-fg-dim">Slug</label>
                  <button
                    type="button"
                    onClick={slugField.onResetToAuto}
                    disabled={!editable}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-dim hover:bg-surface-2 hover:text-fg disabled:opacity-60"
                  >
                    Auto-fill
                  </button>
                </div>
                <input
                  value={slugField.slug}
                  onChange={(e) => slugField.onSlugChange(e.target.value)}
                  disabled={!editable}
                  className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none disabled:opacity-60"
                  required
                />
                {content.status === "PUBLISHED" ? (
                  <p className="mt-2 text-xs text-fg-dim">
                    Changing the slug on published content breaks existing
                    shared links.
                  </p>
                ) : null}
              </div>

              <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4">
                <label className="text-sm text-fg-dim">Excerpt</label>
                <textarea
                  value={form.values.excerpt}
                  onChange={(e) => form.set("excerpt", e.target.value)}
                  disabled={!editable}
                  rows={3}
                  className="mt-2 w-full min-w-0 resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-fg outline-none disabled:opacity-60"
                />
              </div>
            </AccordionPanel>

            {/* Body editor */}
            <div className="mt-5 rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:p-5">
              <div className="min-w-0">
                <label className="text-sm text-fg-dim">Body</label>
                <p className="mt-1 text-xs text-fg-dim">
                  The editor stays open and full-width on mobile and laptops.
                </p>
              </div>

              <div className="mt-4 w-full max-w-full overflow-x-auto pb-1">
                <div className="min-w-max">
                  <EditorToolbar
                    textareaRef={bodyRef}
                    value={form.values.body}
                    onChange={(v) => form.set("body", v)}
                    disabled={!editable}
                  />
                </div>
              </div>

              <AccordionPanel
                panelRef={accordion.refFor("attachments")}
                title="File selector"
                isOpen={accordion.isOpen("attachments")}
                onToggle={() => accordion.toggle("attachments")}
              >
                <div className="grid gap-4 rounded-[1.5rem] border border-border bg-surface p-4 sm:grid-cols-2">
                  <FileDropField
                    label="Add images"
                    helperText="Images can be attached for readers to see in the content."
                    accept="image/*"
                    files={imageSelection.files}
                    onSelect={imageSelection.onSelect}
                    onRemove={imageSelection.onRemove}
                    fileKey={imageSelection.fileKey}
                    disabled={!editable}
                  />
                  <FileDropField
                    label="Add files"
                    helperText="Files can be attached for reader download or reference."
                    files={fileSelection.files}
                    onSelect={fileSelection.onSelect}
                    onRemove={fileSelection.onRemove}
                    fileKey={fileSelection.fileKey}
                    disabled={!editable}
                  />
                </div>
              </AccordionPanel>

              <textarea
                ref={bodyRef}
                value={form.values.body}
                onChange={(e) => form.set("body", e.target.value)}
                disabled={!editable}
                rows={20}
                className="mt-5 min-h-[55vh] w-full max-w-full min-w-0 resize-y rounded-[1.75rem] border border-border bg-surface px-5 py-5 text-sm leading-8 text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40 disabled:opacity-60 sm:min-h-[65vh] md:min-h-[72vh]"
                placeholder="Write your piece here…"
              />
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

        {/* Sidebar */}
        <aside className="min-w-0 space-y-5 2xl:sticky 2xl:top-6 2xl:self-start">
          <AccordionPanel
            panelRef={accordion.refFor("settings")}
            title="Settings"
            isOpen={accordion.isOpen("settings")}
            onToggle={() => accordion.toggle("settings")}
            variant="primary"
          >
            <LabeledSelect
              label="Content type"
              value={form.values.contentType}
              onChange={(v) => form.set("contentType", v)}
              options={contentTypes.map((t) => ({ value: t, label: t }))}
              disabled={!editable}
            />

            <LabeledSelect
              label="Visibility"
              value={form.values.visibility}
              onChange={(v) => form.set("visibility", v)}
              options={visibilityOptions.map((v) => ({ value: v, label: v }))}
              disabled={!editable}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <LabeledSelect
                label="Category"
                value={form.values.categoryId}
                onChange={(v) => form.set("categoryId", v)}
                emptyOption="No category"
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                disabled={!editable}
              />
              <LabeledSelect
                label="Hub"
                value={form.values.hubId}
                onChange={(v) => form.set("hubId", v)}
                emptyOption="No hub"
                options={hubs.map((h) => ({ value: h.id, label: h.name }))}
                disabled={!editable}
              />
            </div>

            <label className="flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim">
              <input
                type="checkbox"
                checked={form.values.isPremium}
                disabled={!editable}
                onChange={(e) => form.set("isPremium", e.target.checked)}
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
          </AccordionPanel>

          <DraftSnapshot
            contentType={form.values.contentType}
            visibility={form.values.visibility}
            title={form.values.title}
            body={form.values.body}
            excerpt={form.values.excerpt}
          />

          <div className="rounded-[2rem] border border-border bg-surface-2 p-5">
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={
                  !editable ||
                  updateMutation.isPending ||
                  uploadAssetsMutation.isPending
                }
                className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateMutation.isPending
                  ? "Saving…"
                  : uploadAssetsMutation.isPending
                    ? "Uploading attachments…"
                    : "Save changes"}
              </button>

              {submittable ? (
                <button
                  type="button"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-fg-dim transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitLabel}
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

// ─── Page (data fetching shell) ────────────────────────────────────────────────

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
  const hubsQuery = useQuery({ queryKey: ["hubs"], queryFn: api.hubs });

  const moderationQuery = useQuery({
    queryKey: ["writer", "content", contentId, "moderation"],
    queryFn: () => api.contentModerationLogs(contentId),
    enabled: Boolean(contentId),
  });

  const moderationNote = useMemo(
    () =>
      moderationQuery.data?.find((log) => log.action === "REJECTED")?.note ??
      null,
    [moderationQuery.data],
  );

  return (
    <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="mx-auto max-w-6xl space-y-8 overflow-x-hidden px-3 pb-10 sm:px-0">
        {contentQuery.isLoading ? (
          <LoadingState label="Loading content…" />
        ) : null}

        {contentQuery.isError ? (
          <div className="rounded-[2rem] border border-danger/30 bg-danger-soft p-6 text-danger">
            Could not load this content.
          </div>
        ) : null}

        {contentQuery.data ? (
          <WriterContentEditor
            content={contentQuery.data}
            contentId={contentId}
            categories={categoriesQuery.data ?? []}
            hubs={hubsQuery.data ?? []}
            moderationNote={moderationNote}
            onSaved={() => {
              queryClient.invalidateQueries({
                queryKey: ["writer", "content"],
              });
              queryClient.invalidateQueries({
                queryKey: ["writer", "content", contentId],
              });
            }}
            onSubmitted={() => {
              queryClient.invalidateQueries({
                queryKey: ["writer", "content"],
              });
              queryClient.invalidateQueries({
                queryKey: ["writer", "content", contentId],
              });
            }}
          />
        ) : null}
      </div>
    </RoleGuard>
  );
}
