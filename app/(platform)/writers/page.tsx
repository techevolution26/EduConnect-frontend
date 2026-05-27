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

    const writers = data ?? [];

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Writers
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Discover creators
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Follow writers, teachers, faith voices, poets, and storytellers.
                </p>
            </section>

            {isLoading ? <LoadingState label="Loading writers..." /> : null}

            {isError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Could not load writers.
                </div>
            ) : null}

            {writers.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {writers.map((writer) => (
                        <Link
                            key={writer.id}
                            href={`/writers/${writer.id}`}
                            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white">
                                    {writer.full_name.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                        {writer.role}
                                    </p>

                                    <h2 className="mt-1 truncate text-xl font-semibold">
                                        {writer.full_name}
                                    </h2>

                                    {writer.username ? (
                                        <p className="mt-1 text-xs text-white/40">
                                            @{writer.username}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            {writer.bio ? (
                                <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/60">
                                    {writer.bio}
                                </p>
                            ) : (
                                <p className="mt-4 text-sm leading-6 text-white/35">
                                    No bio yet.
                                </p>
                            )}

                            <div className="mt-5 flex gap-3 text-xs text-white/40">
                                <span>{writer.followers_count} followers</span>
                                <span>{writer.published_count} posts</span>
                            </div>
                        </Link>
                    ))}
                </section>
            ) : null}

            {data && writers.length === 0 ? (
                <EmptyState
                    title="No writers yet"
                    description="Upgrade users to WRITER, TEACHER, MODERATOR, or ADMIN to appear here."
                />
            ) : null}
        </div>
    );
}