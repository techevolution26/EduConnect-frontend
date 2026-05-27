"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BookOpen,
    CheckCircle2,
    HeartHandshake,
    PenLine,
    UserCheck,
    UserPlus,
} from "lucide-react";
import { useParams } from "next/navigation";

import ContentCard from "@/components/content/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

export default function WriterDetailPage() {
    const params = useParams<{ id: string }>();
    const writerId = params.id;
    const queryClient = useQueryClient();
    const currentUser = getStoredUser();

    const writerQuery = useQuery({
        queryKey: ["writers", writerId],
        queryFn: () => api.writerDetail(writerId),
        enabled: Boolean(writerId),
    });

    const contentQuery = useQuery({
        queryKey: ["writers", writerId, "content"],
        queryFn: () => api.writerContent(writerId),
        enabled: Boolean(writerId),
    });

    const relationshipQuery = useQuery({
        queryKey: ["writers", writerId, "relationship"],
        queryFn: () => api.writerRelationship(writerId),
        enabled: Boolean(writerId && currentUser),
        retry: false,
    });

    const followMutation = useMutation({
        mutationFn: () => api.followWriter(writerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["writers"] });
            queryClient.invalidateQueries({ queryKey: ["writers", writerId] });
            queryClient.invalidateQueries({
                queryKey: ["writers", writerId, "relationship"],
            });
            queryClient.invalidateQueries({ queryKey: ["feed", "for-you"] });
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: () => api.unfollowWriter(writerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["writers"] });
            queryClient.invalidateQueries({ queryKey: ["writers", writerId] });
            queryClient.invalidateQueries({
                queryKey: ["writers", writerId, "relationship"],
            });
            queryClient.invalidateQueries({ queryKey: ["feed", "for-you"] });
        },
    });

    const writer = writerQuery.data;
    const items = contentQuery.data?.items ?? [];

    const isOwnProfile =
        relationshipQuery.data?.is_self ?? currentUser?.id === writerId;

    const isFollowing = relationshipQuery.data?.following ?? false;

    const actionError =
        followMutation.error instanceof ApiError
            ? followMutation.error.detail
            : unfollowMutation.error instanceof ApiError
                ? unfollowMutation.error.detail
                : "Action failed.";

    return (
        <div className="space-y-8">
            {writerQuery.isLoading ? <LoadingState label="Loading writer..." /> : null}

            {writerQuery.isError ? (
                <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-6 text-red-100">
                    Writer profile could not be loaded.
                </div>
            ) : null}

            {writer ? (
                <>
                    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 flex-col gap-5 sm:flex-row">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-white/10 text-3xl font-semibold text-white">
                                    {writer.full_name.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                                        {writer.role}
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                            {writer.full_name}
                                        </h1>

                                        {writer.is_verified ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Verified
                                            </span>
                                        ) : null}
                                    </div>

                                    {writer.username ? (
                                        <p className="mt-2 text-sm text-white/45">
                                            @{writer.username}
                                        </p>
                                    ) : null}

                                    {writer.bio ? (
                                        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
                                            {writer.bio}
                                        </p>
                                    ) : (
                                        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/40">
                                            This writer has not added a bio yet.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {!isOwnProfile && !isFollowing ? (
                                    <button
                                        type="button"
                                        onClick={() => followMutation.mutate()}
                                        disabled={followMutation.isPending}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        {followMutation.isPending ? "Following..." : "Follow"}
                                    </button>
                                ) : null}

                                {!isOwnProfile && isFollowing ? (
                                    <button
                                        type="button"
                                        onClick={() => unfollowMutation.mutate()}
                                        disabled={unfollowMutation.isPending}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-60"
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        {unfollowMutation.isPending ? "Unfollowing..." : "Following"}
                                    </button>
                                ) : null}

                                {isOwnProfile ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50"
                                    >
                                        Own profile
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {followMutation.isError || unfollowMutation.isError ? (
                            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {actionError}
                            </div>
                        ) : null}

                        {followMutation.isSuccess ? (
                            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                You are now following this writer.
                            </div>
                        ) : null}

                        {unfollowMutation.isSuccess ? (
                            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                                You unfollowed this writer.
                            </div>
                        ) : null}
                    </section>

                    <section className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                            <div className="flex items-center gap-3 text-white/45">
                                <HeartHandshake className="h-5 w-5" />
                                <p className="text-sm">Followers</p>
                            </div>

                            <h2 className="mt-3 text-3xl font-semibold">
                                {writer.followers_count}
                            </h2>
                        </div>

                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                            <div className="flex items-center gap-3 text-white/45">
                                <BookOpen className="h-5 w-5" />
                                <p className="text-sm">Published posts</p>
                            </div>

                            <h2 className="mt-3 text-3xl font-semibold">
                                {writer.published_count}
                            </h2>
                        </div>

                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                            <div className="flex items-center gap-3 text-white/45">
                                <PenLine className="h-5 w-5" />
                                <p className="text-sm">Creator type</p>
                            </div>

                            <h2 className="mt-3 text-2xl font-semibold">{writer.role}</h2>
                        </div>
                    </section>

                    <section className="space-y-5">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                                Published content
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold">
                                From {writer.full_name}
                            </h2>
                        </div>

                        {contentQuery.isLoading ? (
                            <LoadingState label="Loading writer content..." />
                        ) : null}

                        {contentQuery.isError ? (
                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                Could not load writer content.
                            </div>
                        ) : null}

                        {items.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {items.map((content) => (
                                    <ContentCard key={content.id} content={content} />
                                ))}
                            </div>
                        ) : null}

                        {contentQuery.data && items.length === 0 ? (
                            <EmptyState
                                title="No published content yet"
                                description="This writer has not published public content yet."
                            />
                        ) : null}
                    </section>
                </>
            ) : null}
        </div>
    );
}