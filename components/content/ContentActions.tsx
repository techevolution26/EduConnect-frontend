"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Eye, Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentCounts = {
  likes: number;
  bookmarks: number;
  comments: number;
  views: number;
};

type EngagementData = {
  liked: boolean;
  bookmarked: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `slug` is required so the post-login redirect lands back on the correct
 * article URL (e.g. /read/my-article-slug) instead of /read/<uuid>.
 */
export default function ContentActions({
  contentId,
  slug,
}: {
  contentId: string;
  slug: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Mount guard: getAccessToken reads localStorage, which is unavailable
  // during SSR. Initialize lazily on the client to avoid an extra render.
  const [isAuthenticated] = useState(() =>
    typeof window !== "undefined" ? Boolean(getAccessToken()) : false,
  );

  const countsQuery = useQuery<ContentCounts>({
    queryKey: ["content", contentId, "counts"],
    queryFn: () => api.contentCounts(contentId) as Promise<ContentCounts>,
  });

  const engagementQuery = useQuery<EngagementData>({
    queryKey: ["content", contentId, "engagement"],
    queryFn: () => api.contentEngagement(contentId),
    enabled: isAuthenticated,
  });

  const liked = engagementQuery.data?.liked ?? false;
  const bookmarked = engagementQuery.data?.bookmarked ?? false;
  const counts = countsQuery.data;

  // ── Like mutation with optimistic update ─────────────────────────────────

  const likeMutation = useMutation({
    mutationFn: async () => {
      await (liked ? api.unlikeContent(contentId) : api.likeContent(contentId));
    },

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["content", contentId, "counts"],
      });
      await queryClient.cancelQueries({
        queryKey: ["content", contentId, "engagement"],
      });

      const prevCounts = queryClient.getQueryData<ContentCounts>([
        "content",
        contentId,
        "counts",
      ]);
      const prevEngagement = queryClient.getQueryData<EngagementData>([
        "content",
        contentId,
        "engagement",
      ]);

      queryClient.setQueryData<ContentCounts>(
        ["content", contentId, "counts"],
        (old) => (old ? { ...old, likes: old.likes + (liked ? -1 : 1) } : old),
      );
      queryClient.setQueryData<EngagementData>(
        ["content", contentId, "engagement"],
        (old) => (old ? { ...old, liked: !liked } : old),
      );

      return { prevCounts, prevEngagement };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevCounts) {
        queryClient.setQueryData(
          ["content", contentId, "counts"],
          context.prevCounts,
        );
      }
      if (context?.prevEngagement) {
        queryClient.setQueryData(
          ["content", contentId, "engagement"],
          context.prevEngagement,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["content", contentId, "counts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["content", contentId, "engagement"],
      });
    },
  });

  // ── Bookmark mutation with optimistic update ──────────────────────────────

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      await (bookmarked
        ? api.unbookmarkContent(contentId)
        : api.bookmarkContent(contentId));
    },

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["content", contentId, "counts"],
      });
      await queryClient.cancelQueries({
        queryKey: ["content", contentId, "engagement"],
      });

      const prevCounts = queryClient.getQueryData<ContentCounts>([
        "content",
        contentId,
        "counts",
      ]);
      const prevEngagement = queryClient.getQueryData<EngagementData>([
        "content",
        contentId,
        "engagement",
      ]);

      queryClient.setQueryData<ContentCounts>(
        ["content", contentId, "counts"],
        (old) =>
          old
            ? { ...old, bookmarks: old.bookmarks + (bookmarked ? -1 : 1) }
            : old,
      );
      queryClient.setQueryData<EngagementData>(
        ["content", contentId, "engagement"],
        (old) => (old ? { ...old, bookmarked: !bookmarked } : old),
      );

      return { prevCounts, prevEngagement };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevCounts) {
        queryClient.setQueryData(
          ["content", contentId, "counts"],
          context.prevCounts,
        );
      }
      if (context?.prevEngagement) {
        queryClient.setQueryData(
          ["content", contentId, "engagement"],
          context.prevEngagement,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["content", contentId, "counts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["content", contentId, "engagement"],
      });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Redirects guests to login with the slug-based return URL.
   * Returns true if the action should proceed, false if redirected.
   */
  function requireLogin(): boolean {
    if (isAuthenticated) return true;
    router.push(`/login?next=${encodeURIComponent(`/read/${slug}`)}`);
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {/* Like */}
      <button
        type="button"
        onClick={handleLike}
        disabled={likeMutation.isPending}
        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition disabled:opacity-60 ${
          liked
            ? "border border-danger/30 bg-danger-soft text-danger"
            : "border border-border bg-surface text-fg-dim hover:bg-surface-2"
        }`}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        {liked ? "Liked" : "Like"}
        <span className="text-fg-dim">{counts?.likes ?? 0}</span>
      </button>

      {/* Bookmark */}
      <button
        type="button"
        onClick={handleBookmark}
        disabled={bookmarkMutation.isPending}
        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition disabled:opacity-60 ${
          bookmarked
            ? "border border-accent/30 bg-accent-soft text-accent-text"
            : "border border-border bg-surface text-fg-dim hover:bg-surface-2"
        }`}
      >
        <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
        {bookmarked ? "Saved" : "Bookmark"}
        <span className="text-fg-dim">{counts?.bookmarks ?? 0}</span>
      </button>

      {/* Views — display only */}
      <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim">
        <Eye className="h-4 w-4" />
        Views
        <span className="text-fg-dim">{counts?.views ?? 0}</span>
      </div>

      {/* Comments — display only */}
      <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim">
        <MessageCircle className="h-4 w-4" />
        Comments
        <span className="text-fg-dim">{counts?.comments ?? 0}</span>
      </div>
    </div>
  );
}
