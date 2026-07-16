"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

export default function WritersPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["writers"],
        queryFn: api.writers,
    });

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
                    Writers
                </p>

                <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">
                    Discover creators
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                    Follow writers, teachers, faith voices, poets, and storytellers.
                </p>
            </section>

            {isLoading ? <LoadingState label="Loading writers..." /> : null}

            {isError ? (
                <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                    Could not load writers.
                </div>
            ) : null}

            {data && data.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.map((writer) => (
                        <Link
                            key={writer.id}
                            href={`/writers/${writer.id}`}
                            className="rounded-[2rem] border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-surface-2"
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-fg-dim">
                                {writer.role}
                            </p>

                            <h2 className="font-display mt-3 text-xl font-semibold">
                                {writer.full_name}
                            </h2>

                            {writer.bio ? (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-fg-dim">
                                    {writer.bio}
                                </p>
                            ) : null}

                            <div className="mt-5 flex gap-3 text-xs text-fg-dim">
                                <span>{writer.followers_count} followers</span>
                                <span>{writer.published_count} posts</span>
                            </div>
                        </Link>
                    ))}
                </section>
            ) : null}

            {data && data.length === 0 ? (
                <EmptyState
                    title="No writers yet"
                    description="Upgrade a user to WRITER, TEACHER, MODERATOR, or ADMIN to appear here."
                />
            ) : null}
        </div>
    );
}