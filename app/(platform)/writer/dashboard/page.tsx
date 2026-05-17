"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import ContentCard from "@/components/content/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type { ContentStatus } from "@/lib/types";

const statusTabs: Array<{ label: string; value: ContentStatus | "" }> = [
    { label: "All", value: "" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Pending", value: "PENDING_REVIEW" },
    { label: "Published", value: "PUBLISHED" },
    { label: "Rejected", value: "REJECTED" },
];

function statusClass(status: ContentStatus) {
    const map: Record<ContentStatus, string> = {
        DRAFT: "bg-white/10 text-white/70",
        PENDING_REVIEW: "bg-amber-500/10 text-amber-200",
        PUBLISHED: "bg-emerald-500/10 text-emerald-200",
        REJECTED: "bg-red-500/10 text-red-200",
        ARCHIVED: "bg-zinc-500/10 text-zinc-200",
    };

    return map[status];
}

export default function WriterDashboardPage() {
    const user = getStoredUser();
    const [statusFilter, setStatusFilter] = useState<ContentStatus | "">("");

    const myContentQuery = useQuery({
        queryKey: ["writer", "content", statusFilter],
        queryFn: () =>
            api.myContent({
                limit: 50,
                status_filter: statusFilter || undefined,
            }),
    });

    const items = myContentQuery.data?.items ?? [];

    return (
        <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN"]}>
            <div className="space-y-8">
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl sm:p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                        Writer Studio
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                        Welcome, {user?.full_name ?? "Creator"}
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                        Create, track, and manage your publishing workflow. Drafts become
                        public only after review approval.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/writer/publish"
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                        >
                            Create new content
                        </Link>

                        <Link
                            href="/feed"
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                        >
                            View public feed
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-sm text-white/45">Your role</p>
                        <h2 className="mt-2 text-2xl font-semibold">{user?.role}</h2>
                        <p className="mt-2 text-sm text-white/55">
                            Your publishing permissions are based on this role.
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-sm text-white/45">Content count</p>
                        <h2 className="mt-2 text-2xl font-semibold">
                            {myContentQuery.data?.total ?? 0}
                        </h2>
                        <p className="mt-2 text-sm text-white/55">
                            Showing content under the selected filter.
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-sm text-white/45">Review model</p>
                        <h2 className="mt-2 text-2xl font-semibold">Moderated</h2>
                        <p className="mt-2 text-sm text-white/55">
                            Content must pass review before publishing.
                        </p>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                                My content
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold">Publishing queue</h2>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {statusTabs.map((tab) => (
                                <button
                                    key={tab.label}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.value)}
                                    className={`rounded-2xl px-4 py-2 text-sm transition ${statusFilter === tab.value
                                        ? "bg-white text-black"
                                        : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {myContentQuery.isLoading ? (
                        <div className="mt-5">
                            <LoadingState label="Loading your content..." />
                        </div>
                    ) : null}

                    {myContentQuery.isError ? (
                        <p className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            Could not load your content. Confirm the backend has
                            GET /api/v1/content/mine.
                        </p>
                    ) : null}

                    {!myContentQuery.isLoading &&
                        !myContentQuery.isError &&
                        items.length > 0 ? (
                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {items.map((content) => (
                                <div key={content.id} className="relative">
                                    <span
                                        className={`absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-xs ${statusClass(
                                            content.status,
                                        )}`}
                                    >
                                        {content.status}
                                    </span>

                                    <ContentCard content={content} />
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {!myContentQuery.isLoading &&
                        !myContentQuery.isError &&
                        items.length === 0 ? (
                        <div className="mt-5">
                            <EmptyState
                                title="No content found"
                                description="Create your first draft or change the selected status filter."
                            />
                        </div>
                    ) : null}
                </section>
            </div>
        </RoleGuard>
    );
}