"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";

import ContentCard from "@/components/content/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

export default function HubDetailPage() {
    const params = useParams<{ slug: string }>();
    const searchParams = useSearchParams();

    const hubId = searchParams.get("id");

    const hubQuery = useQuery({
        queryKey: ["hub", params.slug],
        queryFn: () => api.hubDetail(params.slug),
        enabled: Boolean(params.slug),
    });

    const feedQuery = useQuery({
        queryKey: ["feed", "hub", hubId],
        queryFn: () => api.hubFeed(hubId as string),
        enabled: Boolean(hubId),
    });

    return (
        <div className="space-y-8">
            {hubQuery.isLoading ? <LoadingState label="Loading hub..." /> : null}

            {hubQuery.data ? (
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                        Community hub
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                        {hubQuery.data.name}
                    </h1>

                    {hubQuery.data.description ? (
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                            {hubQuery.data.description}
                        </p>
                    ) : null}
                </section>
            ) : null}

            {feedQuery.isLoading ? <LoadingState label="Loading hub content..." /> : null}

            {feedQuery.data && feedQuery.data.items.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {feedQuery.data.items.map((content) => (
                        <ContentCard key={content.id} content={content} />
                    ))}
                </section>
            ) : null}

            {feedQuery.data && feedQuery.data.items.length === 0 ? (
                <EmptyState
                    title="No content in this hub"
                    description="Publish and approve content attached to this hub."
                />
            ) : null}
        </div>
    );
}