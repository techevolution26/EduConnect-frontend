"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, MessageCircle } from "lucide-react";

import { api } from "@/lib/api";

export default function ContentActions({ contentId }: { contentId: string }) {
    const queryClient = useQueryClient();

    const countsQuery = useQuery({
        queryKey: ["content", contentId, "counts"],
        queryFn: () => api.contentCounts(contentId),
    });

    const likeMutation = useMutation({
        mutationFn: () => api.likeContent(contentId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["content", contentId, "counts"],
            });
        },
    });

    const bookmarkMutation = useMutation({
        mutationFn: () => api.bookmarkContent(contentId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["content", contentId, "counts"],
            });
            queryClient.invalidateQueries({
                queryKey: ["bookmarks"],
            });
        },
    });

    return (
        <div className="mt-6 flex flex-wrap gap-3">
            <button
                type="button"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 disabled:opacity-60"
            >
                <Heart className="h-4 w-4" />
                {likeMutation.isPending ? "Liking..." : "Like"}
                <span className="text-white/40">
                    {countsQuery.data?.likes ?? 0}
                </span>
            </button>

            <button
                type="button"
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 disabled:opacity-60"
            >
                <Bookmark className="h-4 w-4" />
                {bookmarkMutation.isPending ? "Saving..." : "Bookmark"}
                <span className="text-white/40">
                    {countsQuery.data?.bookmarks ?? 0}
                </span>
            </button>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55">
                <MessageCircle className="h-4 w-4" />
                Comments
                <span className="text-white/40">
                    {countsQuery.data?.comments ?? 0}
                </span>
            </div>
        </div>
    );
}