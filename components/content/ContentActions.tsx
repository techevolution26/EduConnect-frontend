"use client";

import { useMutation } from "@tanstack/react-query";
import { Bookmark, Heart } from "lucide-react";

import { api } from "@/lib/api";

export default function ContentActions({ contentId }: { contentId: string }) {
    const likeMutation = useMutation({
        mutationFn: () => api.likeContent(contentId),
    });

    const bookmarkMutation = useMutation({
        mutationFn: () => api.bookmarkContent(contentId),
    });

    return (
        <div className="mt-6 flex flex-wrap gap-3">
            <button
                type="button"
                onClick={() => likeMutation.mutate()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
            >
                <Heart className="h-4 w-4" />
                {likeMutation.isPending ? "Liking..." : "Like"}
            </button>

            <button
                type="button"
                onClick={() => bookmarkMutation.mutate()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
            >
                <Bookmark className="h-4 w-4" />
                {bookmarkMutation.isPending ? "Saving..." : "Bookmark"}
            </button>
        </div>
    );
}