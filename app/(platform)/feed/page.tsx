"use client";

import { useQuery } from "@tanstack/react-query";

import ContentCard from "@/components/content/ContentCard";
import { api } from "@/lib/api";

export default function FeedPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["feed", "discover"],
        queryFn: () => api.discoverFeed({ limit: 30 }),
    });

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Discover
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Stories, learning, faith, and community in one place.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Explore published stories, educational resources, children-safe
                    content, and creator-led posts from across the ecosystem.
                </p>
            </section>

            {isLoading ? (
                <p className="text-sm text-white/50">Loading feed...</p>
            ) : null}

            {isError ? (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Could not load feed. Confirm the FastAPI backend is running.
                </p>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data?.items.map((content) => (
                    <ContentCard key={content.id} content={content} />
                ))}
            </section>

            {data && data.items.length === 0 ? (
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
                    <h2 className="text-lg font-semibold">No published content yet</h2>
                    <p className="mt-2 text-sm text-white/55">
                        Create content in the backend, submit it for review, and approve it
                        as admin.
                    </p>
                </div>
            ) : null}
        </div>
    );
}