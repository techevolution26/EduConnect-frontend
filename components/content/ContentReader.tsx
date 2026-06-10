import type { ContentDetail } from "@/lib/types";
import Link from "next/link";


function formatRelativeTime(dateInput: string | Date): string {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return date.toLocaleDateString();

    const mins = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    // Less than an hour ago
    if (mins < 60) {
        return `${mins === 0 ? 1 : mins} ${mins === 1 ? 'min' : 'mins'} ago`;
    }
    // Less than a day ago
    if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    // Less than 3 weeks ago
    if (days < 21) {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    // Between 3 weeks and 6 weeks ago
    if (weeks >= 3 && weeks <= 6) {
        return `${weeks} weeks ago`;
    }

    // Older than 6 weeks, but still in the current calendar year
    if (date.getFullYear() === now.getFullYear()) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${year}`;
    }

    // Different calendar year (e.g., 2027)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export default function ContentReader({ content }: { content: ContentDetail }) {
    return (
        <article className="mx-auto max-w-3xl">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/40">
                    <span>{content.content_type}</span>
                    <span>•</span>
                    <span>{content.reading_time_minutes} min read</span>
                    {content.requires_partnership ? (
                        <>
                            <span>•</span>
                            <span>Partner content</span>
                        </>
                    ) : null}
                </div>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                    {content.title}
                </h1>

                {content.excerpt ? (
                    <p className="mt-5 text-lg leading-8 text-white/65">
                        {content.excerpt}
                    </p>
                ) : null}

                <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/50 flex justify-between items-center">
                    <span>By {content.author.full_name}</span>
                    <span>{formatRelativeTime(content.published_at!)}</span>
                </div>

            </div>

            {!content.has_access ? (
                <section className="mt-6 rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-6">
                    <h2 className="text-xl font-semibold text-amber-100">
                        Partner-only content
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-amber-100/75">
                        {content.preview_body}
                    </p>

                    <p className="mt-4 text-sm text-amber-100/70">
                        Become a partner to read the full piece and support creators,
                        education, and community storytelling.
                    </p>

                    <Link
                        href="/partnership"
                        className="mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
                    >
                        Become a partner
                    </Link>
                </section>
            ) : (
                <section className="prose prose-invert mt-8 max-w-none">
                    {content.body.split("\n").map((paragraph, index) => (
                        <p key={index} className="text-lg leading-9 text-white/75">
                            {paragraph}
                        </p>
                    ))}
                </section>
            )}
        </article>
    );
}