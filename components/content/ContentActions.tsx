"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type EngagementStatus = {
  liked: boolean;
  bookmarked: boolean;
};

export default function ContentActions({ contentId }: { contentId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(getAccessToken());

  const countsQuery = useQuery({
    queryKey: ["content", contentId, "counts"],
    queryFn: () => api.contentCounts(contentId),
  });

  const engagementQuery = useQuery<EngagementStatus>({
    queryKey: ["content", contentId, "engagement"],
    queryFn: () => api.contentEngagement(contentId),
    enabled: isAuthenticated,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (engagementQuery.data?.liked) {
        return api.unlikeContent(contentId);
      }
      return api.likeContent(contentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "counts"] });
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "engagement"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (engagementQuery.data?.bookmarked) {
        return api.unbookmarkContent(contentId);
      }
      return api.bookmarkContent(contentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "counts"] });
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "engagement"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  function requireLogin() {
    if (isAuthenticated) return true;

    router.push(`/login?next=${encodeURIComponent(`/read/${contentId}`)}`);
    return false;
  }

  function handleLike() {
    if (!requireLogin()) return;
    likeMutation.mutate();
  }

  function handleBookmark() {
    if (!requireLogin()) return;
    bookmarkMutation.mutate();
  }

  const liked = engagementQuery.data?.liked ?? false;
  const bookmarked = engagementQuery.data?.bookmarked ?? false;

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleLike}
        disabled={likeMutation.isPending}
        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition disabled:opacity-60 ${liked
          ? "border border-danger/30 bg-danger-soft text-danger"
          : "border border-border bg-surface text-fg-dim hover:bg-surface-2"
          }`}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        {likeMutation.isPending ? "Updating..." : liked ? "Liked" : "Like"}
        <span className="text-fg-dim">{countsQuery.data?.likes ?? 0}</span>
      </button>

      <button
        type="button"
        onClick={handleBookmark}
        disabled={bookmarkMutation.isPending}
        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition disabled:opacity-60 ${bookmarked
          ? "border border-accent/30 bg-accent-soft text-accent"
          : "border border-border bg-surface text-fg-dim hover:bg-surface-2"
          }`}
      >
        <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
        {bookmarkMutation.isPending ? "Updating..." : bookmarked ? "Saved" : "Bookmark"}
        <span className="text-fg-dim">{countsQuery.data?.bookmarks ?? 0}</span>
      </button>

      <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim">
        <MessageCircle className="h-4 w-4" />
        Comments
        <span className="text-fg-dim">{countsQuery.data?.comments ?? 0}</span>
      </div>
    </div>
  );
}