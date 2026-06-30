import Link from "next/link";

import type { ContentStatus } from "@/lib/types";

function statusClass(status: ContentStatus): string {
    const map: Record<ContentStatus, string> = {
        DRAFT: "bg-white/10 text-white/70",
        PENDING_REVIEW: "bg-amber-500/10 text-amber-200",
        PUBLISHED: "bg-emerald-500/10 text-emerald-200",
        REJECTED: "bg-red-500/10 text-red-200",
        ARCHIVED: "bg-zinc-500/10 text-zinc-200",
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
                <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
                    <h2 className="text-lg font-semibold">Revision required</h2>
                    <p className="mt-3 text-sm leading-6 text-red-100/80">
                        {moderationNote ??
                            "This content was rejected. Please review and update it before resubmitting."}
                    </p>
                </section>
            ) : null}

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-white/40">Writer Studio</p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Manage content</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                            Edit drafts or rejected content, then submit it for review.
                        </p>
                    </div>

                    <span className={`w-fit rounded-full px-3 py-1 text-xs ${statusClass(status)}`}>
                        {status}
                    </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/writer/dashboard"
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
                    >
                        Back to studio
                    </Link>

                    {contentType === "EDUCATION" ? (
                        <Link
                            href={`/writer/content/${contentId}/education`}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
                        >
                            Attach education metadata
                        </Link>
                    ) : null}

                    {contentType === "CHILDREN" && status === "PUBLISHED" ? (
                        <Link
                            href={`/writer/content/${contentId}/children`}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
                        >
                            Add to children library
                        </Link>
                    ) : null}

                    {status === "PUBLISHED" ? (
                        <Link
                            href={`/read/${slug}`}
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
                        >
                            Open public page
                        </Link>
                    ) : null}

                    {submittable ? (
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                        >
                            {submitLabel}
                        </button>
                    ) : null}
                </div>
            </section>
        </>
    );
}