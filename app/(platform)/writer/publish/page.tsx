"use client";

import { useQuery } from "@tanstack/react-query";
import { Save, Sparkles } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EditorToolbar from "@/components/editor/EditorToolbar";
import { api } from "@/lib/api";
import type { ContentType, ContentVisibility } from "@/lib/types";

import { AccordionPanel } from "@/components/editor/AccordionPanel";
import { LabeledSelect } from "@/components/editor/LabeledSelect";
import { FileDropField } from "@/components/editor/FileDropField";
import { DraftSnapshot } from "@/components/editor/DraftSnapshot";
import { PublishStatusBanner } from "@/components/editor/PublishStatusBanner";
import { useAccordionGroup } from "@/hooks/useAccordionGroup";
import { useSlugField } from "@/hooks/useSlugField";
import { useFileSelection } from "@/hooks/useFileSelection";
import { usePublishFlow } from "@/hooks/usePublishFlow";

// ─── Static option lists ──────────────────────────────────────────────

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

// ─── Word/char/reading-time helpers ───────────────────────────────────────────

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function estimateReadingMinutes(text: string) {
  return Math.max(1, Math.round(countWords(text) / 220));
}

// ─── Page ─────────────────────────────────────────────

export default function PublishPage() {
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Accordion state — one hook replaces 3x duplicated panel logic ────────
  const accordion = useAccordionGroup([
    "title",
    "attachments",
    "settings",
  ] as const);

  // ── Form fields ───────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [contentType, setContentType] = useState<ContentType>("ARTICLE");
  const [visibility, setVisibility] = useState<ContentVisibility>("PUBLIC");
  const [isPremium, setIsPremium] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [hubId, setHubId] = useState("");

  const slugField = useSlugField(title);
  const imageSelection = useFileSelection();
  const fileSelection = useFileSelection();
  const flow = usePublishFlow();

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories,
  });
  const hubsQuery = useQuery({ queryKey: ["hubs"], queryFn: api.hubs });

  const wordCount = useMemo(() => countWords(body), [body]);
  const charCount = body.length;
  const readingMinutes = useMemo(() => estimateReadingMinutes(body), [body]);

  // ── Submit ─────────────────────────────────────────────────

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await flow.createDraft(
      {
        title,
        slug: slugField.finalSlug,
        excerpt: excerpt || undefined,
        body,
        content_type: contentType,
        visibility,
        is_premium: isPremium,
        category_id: categoryId || undefined,
        hub_id: hubId || undefined,
        cover_image_url: null,
      },
      imageSelection.files,
      fileSelection.files,
    );

    imageSelection.clear();
    fileSelection.clear();
  }

  const submitLabel = flow.submit.isSuccess
    ? "Submitted for review"
    : flow.submit.isPending
      ? "Submitting…"
      : "Submit for review";

  // ── Render ────────────────────────────────────────────────────

  return (
    <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="mx-auto min-h-screen max-w-[1400px] overflow-x-hidden px-3 py-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-[1.5rem] border border-border bg-surface sm:rounded-[2rem]">
          <div className="kanga" />

          <div className="grid gap-5 p-4 sm:p-8 2xl:grid-cols-[1.45fr_0.85fr] 2xl:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-text sm:px-4 sm:text-xs sm:tracking-[0.22em]">
                <Sparkles className="h-3.5 w-3.5" />
                Publishing studio
              </div>

              <h1 className="font-display mt-4 text-2xl tracking-tight text-fg sm:text-4xl lg:text-5xl">
                Create with calm, clarity, and purpose.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-dim sm:text-base">
                Write your draft in one focused canvas, shape it with the
                toolbar, then submit it for review.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
                {[
                  { label: "Reading time", value: `${readingMinutes} min` },
                  { label: "Words", value: String(wordCount) },
                  { label: "Characters", value: String(charCount) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-fg-dim sm:px-4 sm:py-3 sm:text-sm"
                  >
                    <span className="text-fg-dim">{stat.label}</span>{" "}
                    <span className="ml-1 font-semibold text-fg">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-surface-2 p-4 backdrop-blur sm:rounded-[1.75rem] sm:p-5">
              <div className="flex items-center gap-3">
                <Save className="h-5 w-5 text-fg-dim" />
                <h2 className="font-display font-semibold text-fg">
                  Writing rhythm
                </h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-fg-dim">
                <li>Keep the title, slug, and excerpt concise</li>
                <li>Use the toolbar without leaving the page</li>
                <li>Focus on the body first</li>
                <li>Submit when the draft feels complete</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Form */}
        <form
          onSubmit={handleCreate}
          className="mt-5 grid w-full max-w-full gap-5 overflow-x-hidden 2xl:grid-cols-[1.35fr_0.65fr] sm:mt-6 sm:gap-6"
        >
          {/* Main column */}
          <div className="min-w-0 space-y-5 sm:space-y-6">
            <div className="rounded-[1.5rem] border border-border bg-surface p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:rounded-[2rem] sm:p-6">
              {/* Title / slug / excerpt panel */}
              <AccordionPanel
                panelRef={accordion.refFor("title")}
                title="Title, slug & excerpt"
                isOpen={accordion.isOpen("title")}
                onToggle={() => accordion.toggle("title")}
              >
                <div className="rounded-[1.5rem] border border-border bg-surface p-4">
                  <label className="text-sm text-fg-dim">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40"
                    placeholder="A compelling title"
                    required
                  />
                </div>

                <div className="rounded-[1.5rem] border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm text-fg-dim">Slug</label>
                    <button
                      type="button"
                      onClick={slugField.onResetToAuto}
                      className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-dim hover:bg-surface-2 hover:text-fg"
                    >
                      Auto-fill
                    </button>
                  </div>
                  <input
                    value={slugField.slug}
                    onChange={(e) => slugField.onSlugChange(e.target.value)}
                    className="mt-2 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40"
                    placeholder="your-clean-url-slug"
                    required
                  />
                  <p className="mt-2 break-words text-xs text-fg-dim">
                    Public URL preview:{" "}
                    <span className="break-all text-fg-dim">
                      /read/{slugField.finalSlug || "slug"}
                    </span>
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-border bg-surface p-4">
                  <label className="text-sm text-fg-dim">Excerpt</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={4}
                    className="mt-2 w-full min-w-0 resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40"
                    placeholder="A short summary readers can scan quickly."
                  />
                  <p className="mt-2 text-xs text-fg-dim">
                    Keep it crisp. It should help the reader decide whether to
                    open the piece.
                  </p>
                </div>
              </AccordionPanel>

              {/* Body editor */}
              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-surface-2 p-4 sm:p-5">
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
                      value={body}
                      onChange={setBody}
                    />
                  </div>
                </div>

                {/* Attachments panel */}
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
                    />
                    <FileDropField
                      label="Add files"
                      helperText="Files can be attached for reader download or reference."
                      files={fileSelection.files}
                      onSelect={fileSelection.onSelect}
                      onRemove={fileSelection.onRemove}
                      fileKey={fileSelection.fileKey}
                    />
                  </div>
                </AccordionPanel>

                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={18}
                  className="mt-5 min-h-[55vh] w-full max-w-full min-w-0 resize-y overflow-x-hidden overflow-y-auto rounded-[1.5rem] border border-border bg-surface px-4 py-4 text-sm leading-7 text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40 sm:min-h-[65vh] sm:px-5 sm:py-5 md:min-h-[72vh]"
                  placeholder="Write your piece here."
                  required
                />

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
                value={contentType}
                onChange={setContentType}
                options={contentTypes.map((t) => ({ value: t, label: t }))}
              />

              <LabeledSelect
                label="Visibility"
                value={visibility}
                onChange={setVisibility}
                options={visibilityOptions.map((v) => ({ value: v, label: v }))}
              />

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <LabeledSelect
                  label="Category"
                  value={categoryId}
                  onChange={setCategoryId}
                  emptyOption="No category"
                  options={(categoriesQuery.data ?? []).map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                />
                <LabeledSelect
                  label="Hub"
                  value={hubId}
                  onChange={setHubId}
                  emptyOption="No hub"
                  options={(hubsQuery.data ?? []).map((h) => ({
                    value: h.id,
                    label: h.name,
                  }))}
                />
              </div>

              <label className="flex min-w-0 items-start gap-3 rounded-[1.5rem] border border-border bg-surface px-4 py-4 text-sm text-fg-dim">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
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
              contentType={contentType}
              visibility={visibility}
              title={title}
              body={body}
              excerpt={excerpt}
            />

            <PublishStatusBanner flow={flow} />

            <div className="rounded-[2rem] border border-border bg-surface-2 p-5">
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={
                    flow.create.isPending ||
                    flow.upload.isPending ||
                    Boolean(flow.createdContentId)
                  }
                  className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {flow.create.isPending
                    ? "Creating…"
                    : flow.upload.isPending
                      ? "Uploading attachments…"
                      : flow.createdContentId
                        ? "Draft created"
                        : "Create draft"}
                </button>

                <button
                  type="button"
                  onClick={flow.submitForReview}
                  disabled={!flow.createdContentId || flow.submit.isPending}
                  className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-fg-dim transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitLabel}
                </button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </RoleGuard>
  );
}
