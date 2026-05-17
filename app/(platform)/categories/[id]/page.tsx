"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import ContentCard from "@/components/content/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

export default function CategoryDetailPage() {
    const params = useParams<{ id: string }>();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["feed", "category", params.id],
        queryFn: () => api.categoryFeed(params.id),
        enabled: Boolean(params.id),
    });

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Category feed
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Category content
                </h1>
            </section>

            {isLoading ? <LoadingState label="Loading category content..." /> : null}

            {isError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Could not load category content.
                </div>
            ) : null}

            {data && data.items.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.items.map((content) => (
                        <ContentCard key={content.id} content={content} />
                    ))}
                </section>
            ) : null}

            {data && data.items.length === 0 ? (
                <EmptyState
                    title="No content in this category"
                    description="Publish and approve content attached to this category."
                />
            ) : null}
        </div>
    );
}