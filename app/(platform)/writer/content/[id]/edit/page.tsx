"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Save, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import RoleGuard from "@/components/auth/RoleGuard";
import EditorToolbar from "@/components/editor/EditorToolbar";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import type { ContentStatus, ContentType, ContentVisibility } from "@/lib/types";

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
  content_type: string;
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

  const titlePanelRef = useRef<HTMLDivElement | null>(null);
  const settingsPanelRef = useRef<HTMLDivElement | null>(null);
  const attachmentsPanelRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const [titleOpen, setTitleOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);

  const [title, setTitle] = useState(content.title ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState(content.slug ?? "");
  const [excerpt, setExcerpt] = useState(content.excerpt ?? "");
  const [body, setBody] = useState(content.body ?? "");
  const [contentType, setContentType] = useState<ContentType>(
    content.content_type as ContentType,
  );
  const [visibility, setVisibility] = useState(content.visibility);
  const [isPremium, setIsPremium] = useState(content.is_premium);
  const [categoryId, setCategoryId] = useState(content.category_id ?? "");
  const [hubId, setHubId] = useState(content.hub_id ?? "");
  const [images, setImages] = useState<File[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const editable = canEdit(content.status);
  const submittable = canSubmit(content.status);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;

      if (
        titleOpen &&
        titlePanelRef.current &&
        !titlePanelRef.current.contains(target)
      ) {
        setTitleOpen(false);
      }

      if (
        attachmentsOpen &&
        attachmentsPanelRef.current &&
        !attachmentsPanelRef.current.contains(target)
      ) {
        setAttachmentsOpen(false);
      }

      if (
        settingsOpen &&
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(target)
      ) {
        setSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [titleOpen, attachmentsOpen, settingsOpen]);

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

  const uploadAssetsMutation = useMutation({
    mutationFn: ({
      contentId,
      images,
      files,
    }: {
      contentId: string;
      images: File[];
      files: File[];
    }) => api.uploadContentAssets(contentId, { images, files }),
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
      : uploadAssetsMutation.error instanceof ApiError
        ? uploadAssetsMutation.error.detail
        : submitMutation.error instanceof ApiError
          ? submitMutation.error.detail
          : "Action failed.";

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editable) return;

    await updateMutation.mutateAsync();

    if (images.length > 0 || files.length > 0) {
      await uploadAssetsMutation.mutateAsync({
        contentId,
        images,
        files,
      });
      setImages([]);
      setFiles([]);
    }
  }

  const submitLabel = submitMutation.isSuccess
    ? "Submitted for review"
    : submitMutation.isPending
      ? "Submitting..."
      : content.status === "REJECTED"
        ? "Resubmit for review"
        : "Submit for review";

  return (
    <div className="space-y-8 overflow-x-hidden">
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

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Manage content
            </h1>

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
              {submitLabel}
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

      {updateMutation.isError || uploadAssetsMutation.isError || submitMutation.isError ? (
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
        className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 2xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
      >
        <div className="min-w-0 space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <div
              ref={titlePanelRef}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
            >
              <button
                type="button"
                onClick={() => {
                  setTitleOpen((current) => !current);
                  setSettingsOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="text-sm font-semibold text-white">Title, slug & excerpt</span>
                <ChevronDown
                  className={`h-4 w-4 text-white/45 transition ${titleOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {titleOpen ? (
                <div className="mt-4 grid gap-5">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <label className="text-sm text-white/70">Title</label>
                    <input
                      value={title}
                      onChange={(event) => handleTitleChange(event.target.value)}
                      disabled={!editable}
                      className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                      required
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
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
                      onChange={(event) => {
                        setSlugTouched(true);
                        setSlug(slugify(event.target.value));
                      }}
                      disabled={!editable}
                      className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                      required
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <label className="text-sm text-white/70">Excerpt</label>
                    <textarea
                      value={excerpt}
                      onChange={(event) => setExcerpt(event.target.value)}
                      disabled={!editable}
                      rows={3}
                      className="mt-2 w-full min-w-0 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none disabled:opacity-60"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:p-5">
              <div className="min-w-0">
                <label className="text-sm text-white/70">Body</label>
                <p className="mt-1 text-xs text-white/35">
                  The editor stays open and full-width on mobile and laptops.
                </p>
              </div>

              <div className="mt-4 w-full max-w-full overflow-x-auto pb-1">
                <div className="min-w-max">
                  <EditorToolbar textareaRef={bodyRef} value={body} onChange={setBody} />
                </div>
              </div>

              <div
                ref={attachmentsPanelRef}
                className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
              >
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentsOpen((current) => !current);
                    setTitleOpen(false);
                    setSettingsOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <p className="text-sm font-semibold text-white">File selector</p>
                  <ChevronDown
                    className={`h-4 w-4 text-white/45 transition ${attachmentsOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {attachmentsOpen ? (
                  <div className="mt-4 grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm text-white/70">Add images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          setImages(Array.from(event.target.files ?? []))
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
                      />
                      <p className="mt-2 text-xs text-white/35">
                        Images can be attached for readers to see in the content.
                      </p>
                    </label>

                    <label className="block">
                      <span className="text-sm text-white/70">Add files</span>
                      <input
                        type="file"
                        multiple
                        onChange={(event) =>
                          setFiles(Array.from(event.target.files ?? []))
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
                      />
                      <p className="mt-2 text-xs text-white/35">
                        Files can be attached for reader download or reference.
                      </p>
                    </label>

                    {images.length > 0 || files.length > 0 ? (
                      <div className="sm:col-span-2">
                        <p className="text-sm font-semibold text-white">Attachments</p>

                        {images.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                              Images
                            </p>
                            <ul className="mt-2 space-y-2 text-sm text-white/70">
                              {images.map((file) => (
                                <li
                                  key={`${file.name}-${file.size}-${file.lastModified}`}
                                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                                >
                                  {file.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {files.length > 0 ? (
                          <div className="mt-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                              Files
                            </p>
                            <ul className="mt-2 space-y-2 text-sm text-white/70">
                              {files.map((file) => (
                                <li
                                  key={`${file.name}-${file.size}-${file.lastModified}`}
                                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                                >
                                  {file.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <textarea
                ref={bodyRef}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                disabled={!editable}
                rows={20}
                className="mt-5 min-h-[55vh] w-full max-w-full min-w-0 resize-y rounded-[1.75rem] border border-white/10 bg-[#0d1016] px-5 py-5 text-sm leading-8 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-60 sm:min-h-[65vh] md:min-h-[72vh]"
                placeholder="Write your piece here..."
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-white/45">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {body.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {Math.max(
                  1,
                  Math.round(body.trim().split(/\s+/).filter(Boolean).length / 220),
                )}{" "}
                min read
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {body.length} characters
              </span>
            </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-5 2xl:sticky 2xl:top-6 2xl:self-start">
          <div
            ref={settingsPanelRef}
            className="rounded-[2rem] border border-white/10 bg-black/20 p-5"
          >
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((current) => !current);
                setTitleOpen(false);
                setAttachmentsOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <ChevronDown
                className={`h-4 w-4 text-white/45 transition ${settingsOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {settingsOpen ? (
              <div className="mt-5 grid gap-4">
                <div className="min-w-0">
                  <label className="text-sm text-white/70">Content type</label>
                  <select
                    value={contentType}
                    onChange={(event) =>
                      setContentType(event.target.value as ContentType)
                    }
                    disabled={!editable}
                    className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                  >
                    {contentTypes.map((type) => (
                      <option className="bg-[#111113] text-white" key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="text-sm text-white/70">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(event.target.value as ContentVisibility)
                    }
                    disabled={!editable}
                    className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                  >
                    {visibilityOptions.map((option) => (
                      <option className="bg-[#111113] text-white" key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="min-w-0">
                    <label className="text-sm text-white/70">Category</label>
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      disabled={!editable}
                      className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                    >
                      <option className="bg-[#111113] text-white" value="">
                        No category
                      </option>
                      {categories.map((category) => (
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

                  <div className="min-w-0">
                    <label className="text-sm text-white/70">Hub</label>
                    <select
                      value={hubId}
                      onChange={(event) => setHubId(event.target.value)}
                      disabled={!editable}
                      className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
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

                <label className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={isPremium}
                    disabled={!editable}
                    onChange={(event) => setIsPremium(event.target.checked)}
                    className="mt-1 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-white">
                      Mark as partner-only / premium content
                    </span>
                    <span className="mt-1 block break-words text-xs leading-5 text-white/40">
                      Use this for exclusive or partnership-supported material.
                    </span>
                  </span>
                </label>
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <h3 className="text-sm font-semibold text-white">Writing snapshot</h3>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                {contentType} • {visibility}
              </p>
              <h4 className="mt-3 text-xl font-semibold text-white">
                {title || "Untitled draft"}
              </h4>
              <p className="mt-3 line-clamp-4 break-words text-sm leading-6 text-white/65">
                {body.trim() || excerpt.trim() || "Your draft preview will appear here."}
              </p>
            </div>
          </div>

          {updateMutation.isError || uploadAssetsMutation.isError || submitMutation.isError ? (
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

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={!editable || updateMutation.isPending || uploadAssetsMutation.isPending}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateMutation.isPending
                  ? "Saving..."
                  : uploadAssetsMutation.isPending
                    ? "Uploading attachments..."
                    : "Save changes"}
              </button>

              {submittable ? (
                <button
                  type="button"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
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
    return moderationQuery.data?.find((log) => log.action === "REJECTED")?.note ?? null;
  }, [moderationQuery.data]);

  return (
    <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN"]}>
      <div className="mx-auto max-w-6xl space-y-8 overflow-x-hidden px-3 pb-10 sm:px-0">
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