import Link from "next/link";

import type { ContentStatus } from "@/lib/types";

function statusClass(status: ContentStatus): string {
  const map: Record<ContentStatus, string> = {
    DRAFT: "bg-surface-2 text-fg-dim",
    PENDING_REVIEW: "bg-accent-soft text-accent-text",
    PUBLISHED: "bg-success-soft text-success",
    REJECTED: "bg-danger-soft text-danger",
    ARCHIVED: "bg-surface-2 text-fg-dim",
  };
  return map[status];
}

export function EditModeStatusBar({
  status,
  contentType,
  contentId,
  slug,
  moderationNote,
  submittable,
  isSubmitting,
  submitLabel,
  onSubmit,
}: {
  status: ContentStatus;
  contentType: string;
  contentId: string;
  slug: string;
  moderationNote?: string | null;
  submittable: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: () => void;
}) {
  return (
    <>
      {status === "REJECTED" ? (
        <section className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-danger">
          <h2 className="font-display text-lg font-semibold">
            Revision required
          </h2>
          <p className="mt-3 text-sm leading-6 text-danger">
            {moderationNote ??
              "This content was rejected. Please review and update it before resubmitting."}
          </p>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
              Writer Studio
            </p>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">
              Manage content
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
              Edit drafts or rejected content, then submit it for review.
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1 text-xs ${statusClass(status)}`}
          >
            {status}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/writer/dashboard"
            className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
          >
            Back to studio
          </Link>

          {contentType === "EDUCATION" ? (
            <Link
              href={`/writer/content/${contentId}/education`}
              className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
            >
              Attach education metadata
            </Link>
          ) : null}

          {contentType === "CHILDREN" && status === "PUBLISHED" ? (
            <Link
              href={`/writer/content/${contentId}/children`}
              className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
            >
              Add to children library
            </Link>
          ) : null}

          {status === "PUBLISHED" ? (
            <Link
              href={`/read/${slug}`}
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent"
            >
              Open public page
            </Link>
          ) : null}

          {submittable ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent disabled:opacity-60"
            >
              {submitLabel}
            </button>
          ) : null}
        </div>
      </section>
    </>
  );
}
