import Link from "next/link";

import type { Content } from "@/lib/types";

export default function ContentCard({ content }: { content: Content }) {
    return (
        <Link
            href={`/read/${content.slug}`}
            className="group block rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
        >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40">
                <span>{content.content_type}</span>
                {content.is_premium ? <span>• Partner</span> : null}
            </div>

            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white group-hover:text-white">
                {content.title}
            </h2>

            {content.excerpt ? (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                    {content.excerpt}
                </p>
            ) : null}

            <div className="mt-5 flex items-center justify-between text-xs text-white/40">
                <span>{content.reading_time_minutes} min read</span>
                <span>{content.visibility}</span>
            </div>
        </Link>
    );
}