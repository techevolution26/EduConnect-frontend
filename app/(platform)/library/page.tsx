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
            <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
                <div className="kanga" />
                <div className="p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-accent">
                        Library
                    </p>

                    <h1 className="font-display mt-3 text-3xl tracking-tight text-fg">
                        Saved reading
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                        Your bookmarked stories, learning resources, faith posts, and
                        articles are saved here for later reading.
                    </p>
                </div>
            </section>

            {bookmarksQuery.isLoading ? (
                <LoadingState label="Loading saved content..." />
            ) : null}

            {bookmarksQuery.isError ? (
                <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                    Could not load your saved content.
                </div>
            ) : null}

            {items.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((content) => (
                        <article
                            key={content.id}
                            className="rounded-[2rem] border border-border bg-surface p-5"
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-fg-dim">
                                {content.content_type}
                            </p>

                            <h2 className="font-display mt-3 text-xl font-semibold">{content.title}</h2>

                            {content.excerpt ? (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-fg-dim">
                                    {content.excerpt}
                                </p>
                            ) : null}

                            <div className="mt-5 flex flex-wrap gap-2">
                                <Link
                                    href={`/read/${content.slug}`}
                                    className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent"
                                >
                                    Read
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => unbookmarkMutation.mutate(content.id)}
                                    disabled={unbookmarkMutation.isPending}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-2 text-sm font-semibold text-danger disabled:opacity-60"
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