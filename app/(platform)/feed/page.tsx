"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import ContentCard from "@/components/content/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

type FeedTab = "discover" | "for-you";

export default function FeedPage() {
    const [activeTab, setActiveTab] = useState<FeedTab>("discover");

    const discoverQuery = useQuery({
        queryKey: ["feed", "discover"],
        queryFn: () => api.discoverFeed({ limit: 30 }),
    });

    const forYouQuery = useQuery({
        queryKey: ["feed", "for-you"],
        queryFn: () => api.forYouFeed(),
        enabled: activeTab === "for-you",
    });

    const currentQuery = activeTab === "discover" ? discoverQuery : forYouQuery;
    const items = currentQuery.data?.items ?? [];

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Reading ecosystem
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Discover stories, lessons, faith, and community voices.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Browse public content or switch to your personalized feed based on
                    followed writers, joined hubs, and your role.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("discover")}
                        className={`rounded-2xl px-4 py-2 text-sm transition ${activeTab === "discover"
                            ? "bg-white text-black"
                            : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                            }`}
                    >
                        Discover
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("for-you")}
                        className={`rounded-2xl px-4 py-2 text-sm transition ${activeTab === "for-you"
                            ? "bg-white text-black"
                            : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                            }`}
                    >
                        For you
                    </button>
                </div>
            </section>

            {currentQuery.isLoading ? <LoadingState label="Loading feed..." /> : null}

            {currentQuery.isError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Could not load feed. Confirm the FastAPI backend is running.
                </div>
            ) : null}

            {!currentQuery.isLoading && !currentQuery.isError && items.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((content) => (
                        <ContentCard key={content.id} content={content} />
                    ))}
                </section>
            ) : null}

            {!currentQuery.isLoading && !currentQuery.isError && items.length === 0 ? (
                <EmptyState
                    title={
                        activeTab === "discover"
                            ? "No published content yet"
                            : "Your personalized feed is empty"
                    }
                    description={
                        activeTab === "discover"
                            ? "Create content in the backend, submit it for review, and approve it as admin."
                            : "Follow writers or join hubs to personalize this feed."
                    }
                />
            ) : null}
        </div>
    );
}