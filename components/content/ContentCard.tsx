import Link from "next/link";

import type { Content } from "@/lib/types";

export default function ContentCard({ content }: { content: Content }) {
    return (
        <Link
            href={`/read/${content.slug}`}
            className="group block rounded-[2rem] border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-surface-2"
        >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-dim">
                <span>{content.content_type}</span>
                {content.is_premium ? <span className="text-accent">• Partner</span> : null}
            </div>

            <h2 className="mt-4 font-display text-xl tracking-tight text-fg">
                {content.title}
            </h2>

            {content.excerpt ? (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-fg-dim">
                    {content.excerpt}
                </p>
            ) : null}

            {content.is_premium ? <div className="kanga-thin mt-4 w-16" /> : null}

            <div className="mt-5 flex items-center justify-between text-xs text-fg-dim">
                <span>{content.reading_time_minutes} min read</span>
                <span>{content.visibility}</span>
            </div>
        </Link>
    );
}