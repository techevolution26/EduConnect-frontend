"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Save, Sparkles } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EditorToolbar from "@/components/editor/EditorToolbar";
import { api, ApiError } from "@/lib/api";
import type { ContentType, ContentVisibility } from "@/lib/types";

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

export default function PublishPage() {
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const titlePanelRef = useRef<HTMLDivElement | null>(null);
  const attachmentsPanelRef = useRef<HTMLDivElement | null>(null);
  const settingsPanelRef = useRef<HTMLDivElement | null>(null);

  const [titleOpen, setTitleOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
  const [images, setImages] = useState<File[]>([]);
  const [files, setFiles] = useState<File[]>([]);
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
  const wordCount = useMemo(() => countWords(body), [body]);
  const charCount = useMemo(() => countCharacters(body), [body]);
  const readingMinutes = useMemo(() => estimateReadingMinutes(body), [body]);

  const createMutation = useMutation({
    mutationFn: api.createContent,
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
    mutationFn: api.submitContentForReview,
  });

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

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function mergeFiles(prev: File[], next: File[]) {
    const seen = new Set(
      prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`),
    );

    const merged = [...prev];

    for (const file of next) {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(file);
      }
    }

    return merged;
  }

  function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setImages((prev) => mergeFiles(prev, selected));
    event.currentTarget.value = "";
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setFiles((prev) => mergeFiles(prev, selected));
    event.currentTarget.value = "";
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = await createMutation.mutateAsync({
      title,
      slug: slug || computedSlug,
      excerpt: excerpt || undefined,
      body,
      content_type: contentType,
      visibility,
      is_premium: isPremium,
      category_id: categoryId || undefined,
      hub_id: hubId || undefined,
      cover_image_url: null,
    });

    setCreatedContentId(content.id);

    if (images.length > 0 || files.length > 0) {
      await uploadAssetsMutation.mutateAsync({
        contentId: content.id,
        images,
        files,
      });
      setImages([]);
      setFiles([]);
    }

    submitMutation.reset();
  }

  function handleSubmitForReview() {
    if (!createdContentId) return;
    submitMutation.mutate(createdContentId);
  }

  const createError =
    createMutation.error instanceof ApiError
      ? createMutation.error.detail
      : "Could not create content.";

  const uploadError =
    uploadAssetsMutation.error instanceof ApiError
      ? uploadAssetsMutation.error.detail
      : "Could not upload attachments.";

  const submitError =
    submitMutation.error instanceof ApiError
      ? submitMutation.error.detail
      : "Could not submit content.";

  const submitLabel = submitMutation.isSuccess
    ? "Submitted for review"
    : submitMutation.isPending
      ? "Submitting..."
      : "Submit for review";

  return (
    <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN"]}>
      <div className="mx-auto min-h-screen max-w-[1400px] overflow-x-hidden px-3 py-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-950 via-zinc-950 to-black p-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:rounded-[2rem] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.08),transparent_28%),radial-gradient(circle_at_center,rgba(14,165,233,0.07),transparent_34%)]" />

          <div className="relative grid gap-5 2xl:grid-cols-[1.45fr_0.85fr] 2xl:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-100 sm:px-4 sm:text-xs sm:tracking-[0.22em]">
                <Sparkles className="h-3.5 w-3.5" />
                Publishing studio
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Create with calm, clarity, and purpose.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
                Write your draft in one focused canvas, shape it with the toolbar, then submit it for review.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/75 sm:px-4 sm:py-3 sm:text-sm">
                  <span className="text-white/45">Reading time</span>{" "}
                  <span className="ml-1 font-semibold text-white">{readingMinutes} min</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/75 sm:px-4 sm:py-3 sm:text-sm">
                  <span className="text-white/45">Words</span>{" "}
                  <span className="ml-1 font-semibold text-white">{wordCount}</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/75 sm:px-4 sm:py-3 sm:text-sm">
                  <span className="text-white/45">Characters</span>{" "}
                  <span className="ml-1 font-semibold text-white">{charCount}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4 backdrop-blur sm:rounded-[1.75rem] sm:p-5">
              <div className="flex items-center gap-3">
                <Save className="h-5 w-5 text-white/45" />
                <h2 className="font-semibold text-white">Writing rhythm</h2>
              </div>

              <div className="mt-4 space-y-3 text-sm text-white/60">
                <p>• Keep the title, slug, and excerpt concise</p>
                <p>• Use the toolbar without leaving the page</p>
                <p>• Focus on the body first</p>
                <p>• Submit when the draft feels complete</p>
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleCreate}
          className="mt-5 grid w-full max-w-full gap-5 overflow-x-hidden 2xl:grid-cols-[1.35fr_0.65fr] sm:mt-6 sm:gap-6"
        >
          <div className="min-w-0 space-y-5 sm:space-y-6">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:rounded-[2rem] sm:p-6">
              <div
                ref={titlePanelRef}
                className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:p-5"
              >
                <button
                  type="button"
                  onClick={() => {
                    setTitleOpen((current) => !current);
                    setAttachmentsOpen(false);
                    setSettingsOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="text-sm font-semibold text-white">
                    Title, slug & excerpt
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-white/45 transition ${titleOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {titleOpen ? (
                  <div className="mt-4 grid gap-5">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                      <label className="text-sm text-white/70">Title</label>
                      <input
                        value={title}
                        onChange={(event) => handleTitleChange(event.target.value)}
                        className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
                        placeholder="A compelling title"
                        required
                      />
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm text-white/70">Slug</label>
                        <button
                          type="button"
                          onClick={() => setSlug(slugify(title))}
                          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
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
                        className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
                        placeholder="your-clean-url-slug"
                        required
                      />

                      <p className="mt-2 break-words text-xs text-white/35">
                        Public URL preview:{" "}
                        <span className="break-all text-white/55">
                          /read/{slug || computedSlug || "slug"}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                      <label className="text-sm text-white/70">Excerpt</label>
                      <textarea
                        value={excerpt}
                        onChange={(event) => setExcerpt(event.target.value)}
                        rows={4}
                        className="mt-2 w-full min-w-0 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
                        placeholder="A short summary readers can scan quickly."
                      />

                      <p className="mt-2 text-xs text-white/35">
                        Keep it crisp. It should help the reader decide whether to open the piece.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:p-5">
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
                          onChange={handleImageSelect}
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
                          onChange={handleFileSelect}
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
                  rows={18}
                  className="mt-5 min-h-[55vh] w-full max-w-full min-w-0 resize-y overflow-x-hidden overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#0d1016] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 sm:min-h-[65vh] sm:px-5 sm:py-5 md:min-h-[72vh]"
                  placeholder="Write your piece here."
                  required
                />

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {wordCount} words
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {readingMinutes} min read
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {charCount} characters
                  </span>
                </div>
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
                      onChange={(event) => setContentType(event.target.value as ContentType)}
                      className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    >
                      {contentTypes.map((type) => (
                        <option key={type} value={type}>
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
                      className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                    >
                      {visibilityOptions.map((option) => (
                        <option key={option} value={option}>
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
                        className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
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
                      <label className="text-sm text-white/70">Hub</label>
                      <select
                        value={hubId}
                        onChange={(event) => setHubId(event.target.value)}
                        className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
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

                  <label className="flex min-w-0 items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/75">
                    <input
                      type="checkbox"
                      checked={isPremium}
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
              <h3 className="text-sm font-semibold text-white">Draft snapshot</h3>

              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="break-words text-xs uppercase tracking-[0.2em] text-white/35">
                  {contentType} • {visibility}
                </p>
                <h4 className="mt-3 break-words text-xl font-semibold text-white">
                  {title || "Untitled draft"}
                </h4>
                <p className="mt-3 line-clamp-4 break-words text-sm leading-6 text-white/65">
                  {body.trim() || excerpt.trim() || "Your draft summary will appear here."}
                </p>
              </div>
            </div>

            {createMutation.isError ? (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {createError}
              </p>
            ) : null}

            {uploadAssetsMutation.isError ? (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {uploadError}
              </p>
            ) : null}

            {submitMutation.isError ? (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {submitError}
              </p>
            ) : null}

            {createMutation.isSuccess ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Draft created successfully.
              </div>
            ) : null}

            {submitMutation.isSuccess ? (
              <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Content submitted for review.
              </p>
            ) : null}

            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending || uploadAssetsMutation.isPending}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createMutation.isPending
                    ? "Creating..."
                    : uploadAssetsMutation.isPending
                      ? "Uploading attachments..."
                      : "Create draft"}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={!createdContentId || submitMutation.isPending}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
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