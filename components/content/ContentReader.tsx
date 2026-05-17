import type { ContentDetail } from "@/lib/types";

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

                <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/50">
                    By {content.author.full_name}
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