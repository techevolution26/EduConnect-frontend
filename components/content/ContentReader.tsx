import Link from "next/link";

import type { ContentDetail } from "@/lib/types";

type ContentAsset = {
    id: string;
    asset_type: "IMAGE" | "FILE" | string;
    url: string;
    filename?: string | null;
    mime_type?: string | null;
};

function formatRelativeTime(dateInput: string | Date): string {
    const date = new Date(dateInput);
    const now = new Date();

    if (Number.isNaN(date.getTime())) return "";

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return date.toLocaleDateString();

    const mins = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (mins < 60) {
        return `${mins === 0 ? 1 : mins} ${mins === 1 ? "min" : "mins"} ago`;
    }

    if (hours < 24) {
        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    if (days < 21) {
        return `${days} ${days === 1 ? "day" : "days"} ago`;
    }

    if (weeks >= 3 && weeks <= 6) {
        return `${weeks} weeks ago`;
    }

    if (date.getFullYear() === now.getFullYear()) {
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${year}`;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getFileLabel(asset: ContentAsset) {
    return asset.filename || "Download file";
}

export default function ContentReader({ content }: { content: ContentDetail }) {
    const assets = (content.assets ?? []) as ContentAsset[];
    const imageAssets = assets.filter((asset) => asset.asset_type === "IMAGE");
    const fileAssets = assets.filter((asset) => asset.asset_type === "FILE");

    const coverImage = content.cover_image_url || imageAssets[0]?.url || null;
    const galleryImages = coverImage
        ? imageAssets.filter((asset) => asset.url !== coverImage)
        : imageAssets;

    return (
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/45">
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

            {coverImage ? (
                <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
                    <img
                        src={coverImage}
                        alt={content.title}
                        className="h-auto w-full object-cover"
                    />
                </div>
            ) : null}

            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                {content.title}
            </h1>

            {content.excerpt ? (
                <p className="mt-5 text-lg leading-8 text-white/65">{content.excerpt}</p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
                <span>By {content.author.full_name}</span>
                <span>
                    {content.published_at
                        ? formatRelativeTime(content.published_at)
                        : formatRelativeTime(content.created_at)}
                </span>
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
                <>
                    <section className="prose prose-invert mt-8 max-w-none">
                        {content.body.split("\n").map((paragraph, index) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return <div key={index} className="h-4" />;

                            return (
                                <p key={index} className="text-lg leading-9 text-white/75">
                                    {trimmed}
                                </p>
                            );
                        })}
                    </section>

                    {galleryImages.length > 0 ? (
                        <section className="mt-10 space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                                    Images
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">
                                    Attached visuals
                                </h2>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {galleryImages.map((asset) => (
                                    <figure
                                        key={asset.id}
                                        className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20"
                                    >
                                        <img
                                            src={asset.url}
                                            alt={asset.filename || content.title}
                                            className="h-auto w-full object-cover"
                                        />
                                        {asset.filename ? (
                                            <figcaption className="border-t border-white/10 px-4 py-3 text-xs text-white/45">
                                                {asset.filename}
                                            </figcaption>
                                        ) : null}
                                    </figure>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {fileAssets.length > 0 ? (
                        <section className="mt-10 space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                                    Files
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">
                                    Downloadable resources
                                </h2>
                            </div>

                            <div className="grid gap-3">
                                {fileAssets.map((asset) => (
                                    <a
                                        key={asset.id}
                                        href={asset.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-white/5"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white">
                                                {getFileLabel(asset)}
                                            </p>
                                            {asset.mime_type ? (
                                                <p className="mt-1 text-xs text-white/40">
                                                    {asset.mime_type}
                                                </p>
                                            ) : null}
                                        </div>

                                        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                                            Open
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </>
            )}
        </article>
    );
}