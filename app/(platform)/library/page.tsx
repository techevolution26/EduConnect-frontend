"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { BookmarkX } from "lucide-react";

import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

export default function LibraryPage() {
    const queryClient = useQueryClient();

    const bookmarksQuery = useQuery({
        queryKey: ["bookmarks"],
        queryFn: api.myBookmarks,
    });

    const unbookmarkMutation = useMutation({
        mutationFn: api.unbookmarkContent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
        },
    });

    const items = bookmarksQuery.data ?? [];

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Library
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Saved reading
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Your bookmarked stories, learning resources, faith posts, and
                    articles are saved here for later reading.
                </p>
            </section>

            {bookmarksQuery.isLoading ? (
                <LoadingState label="Loading saved content..." />
            ) : null}

            {bookmarksQuery.isError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Could not load your saved content.
                </div>
            ) : null}

            {items.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((content) => (
                        <article
                            key={content.id}
                            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                {content.content_type}
                            </p>

                            <h2 className="mt-3 text-xl font-semibold">{content.title}</h2>

                            {content.excerpt ? (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                                    {content.excerpt}
                                </p>
                            ) : null}

                            <div className="mt-5 flex flex-wrap gap-2">
                                <Link
                                    href={`/read/${content.slug}`}
                                    className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
                                >
                                    Read
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => unbookmarkMutation.mutate(content.id)}
                                    disabled={unbookmarkMutation.isPending}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 disabled:opacity-60"
                                >
                                    <BookmarkX className="h-4 w-4" />
                                    Remove
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            ) : null}

            {bookmarksQuery.data && items.length === 0 ? (
                <EmptyState
                    title="No saved content yet"
                    description="Bookmark stories, articles, and learning resources to keep them here."
                />
            ) : null}
        </div>
    );
}