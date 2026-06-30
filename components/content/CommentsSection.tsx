"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CornerDownRight, Heart } from "lucide-react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type CommentUser = {
  username?: string | null;
  full_name?: string | null;
};

type CommentItem = {
  id: string;
  body: string;
  created_at: string;
  parent_id?: string | null;
  likes_count?: number;
  liked_by_me?: boolean;
  user?: CommentUser | null;
};

type CommentNode = CommentItem & { children: CommentNode[] };

// ─── Context — eliminates 14-prop drilling from CommentNodeView ───────────────

type CommentsCtx = {
  contentId: string;
  isAuthenticated: boolean;
  goToLogin: () => void;
  replyToId: string | null;
  setReplyToId: (id: string | null) => void;
  replyBodyById: Record<string, string>;
  setReplyBody: (commentId: string, value: string) => void;
  collapsedById: Record<string, boolean>;
  toggleCollapsed: (commentId: string, currentState: boolean) => void;
  openReply: (commentId: string) => void;
  onReplySubmit: (parentId: string) => void;
  onToggleLike: (commentId: string, liked: boolean) => void;
  pendingLikeId: string | null;
  /** Single source of truth — driven by createMutation.isPending + parentId */
  pendingReplyId: string | null;
};

const CommentsContext = createContext<CommentsCtx | null>(null);

function useComments() {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error("useComments must be used inside CommentsSection");
  return ctx;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getAuthorLabel(comment: CommentItem): string {
  return comment.user?.full_name || comment.user?.username || "Anonymous";
}

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatCommentDate(value: string): string {
  return new Date(value).toLocaleString();
}

function buildTree(items: CommentItem[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const item of items) byId.set(item.id, { ...item, children: [] });

  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (nodes: CommentNode[]) => {
    nodes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (const node of nodes) sort(node.children);
  };

  sort(roots);
  return roots;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function depthStyles(depth: number) {
  const cards = [
    "border-white/10 bg-black/20",
    "border-white/10 bg-white/[0.03]",
    "border-cyan-400/20 bg-cyan-400/[0.04]",
    "border-fuchsia-400/20 bg-fuchsia-400/[0.05]",
    "border-amber-400/20 bg-amber-400/[0.05]",
  ];

  const idx = Math.min(depth, cards.length - 1);
  const isNested = depth > 0;

  return {
    card: cards[idx],
    wrapper: isNested ? "ml-1 sm:ml-4 border-l border-white/10 pl-3 sm:pl-5" : "",
    avatarSize: isNested ? "h-9 w-9" : "h-10 w-10",
    meta: isNested ? "text-[11px] text-white/35" : "text-xs text-white/35",
    body: "text-sm leading-6 " + (isNested ? "text-white/72" : "text-white/75"),
    actions: isNested ? "mt-3" : "mt-4",
  };
}

// ─── Comment node ─────────────────────────────────────────────────────────────

function CommentNodeView({ node, depth }: { node: CommentNode; depth: number }) {
  const {
    isAuthenticated,
    goToLogin,
    replyToId,
    setReplyToId,
    replyBodyById,
    setReplyBody,
    collapsedById,
    toggleCollapsed,
    openReply,
    onReplySubmit,
    onToggleLike,
    pendingLikeId,
    pendingReplyId,
  } = useComments();

  const authorLabel = getAuthorLabel(node);
  const initials = getInitials(authorLabel);
  const styles = depthStyles(depth);
  const hasChildren = node.children.length > 0;
  const isReplyOpen = replyToId === node.id;

  // Root comments start expanded; nested replies start collapsed.
  // `collapsedById[id]` explicitly overrides the default.
  const isCollapsed = collapsedById[node.id] ?? depth >= 1;

  return (
    <div className={styles.wrapper}>
      <article
        className={[
          "rounded-2xl border p-4 transition",
          styles.card,
          depth === 0 ? "shadow-sm shadow-black/10" : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={[
              "shrink-0 rounded-full border border-white/10 bg-white/5",
              "flex items-center justify-center text-xs font-semibold text-white/80",
              styles.avatarSize,
            ].join(" ")}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{authorLabel}</p>
                {node.user?.username ? (
                  <p className={styles.meta}>@{node.user.username}</p>
                ) : null}
              </div>
              <p className={`${styles.meta} shrink-0`}>{formatCommentDate(node.created_at)}</p>
            </div>

            {/* Body */}
            <p className={`mt-3 ${styles.body}`}>{node.body}</p>

            {/* Actions */}
            <div className={styles.actions}>
              <div className="flex flex-wrap items-center gap-2">
                {/* Like */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) { goToLogin(); return; }
                    onToggleLike(node.id, Boolean(node.liked_by_me));
                  }}
                  disabled={pendingLikeId === node.id}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-60",
                    node.liked_by_me
                      ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                  ].join(" ")}
                >
                  <Heart className={`h-3.5 w-3.5 ${node.liked_by_me ? "fill-current" : ""}`} />
                  <span>{node.likes_count ?? 0}</span>
                </button>

                {/* Reply */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) { goToLogin(); return; }
                    openReply(node.id);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                >
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Reply
                </button>

                {/* Show / hide replies */}
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(node.id, isCollapsed)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                  >
                    {isCollapsed ? "Show replies" : "Hide replies"}
                    <span className="text-white/40">({node.children.length})</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Inline reply form */}
            {isReplyOpen ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-white/45">
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Replying to {authorLabel}
                </div>
                <textarea
                  value={replyBodyById[node.id] ?? ""}
                  onChange={(e) => setReplyBody(node.id, e.target.value)}
                  rows={3}
                  placeholder="Write a reply…"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-white/30"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onReplySubmit(node.id)}
                    disabled={pendingReplyId === node.id}
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                  >
                    {pendingReplyId === node.id ? "Posting…" : "Post reply"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyToId(null)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {/* Recursive children */}
      {hasChildren && !isCollapsed ? (
        <div className="mt-4 space-y-3">
          {node.children.map((child) => (
            <CommentNodeView key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

/**
 * `slug` is required for the post-login redirect so it returns to
 * /read/<slug> rather than /read/<uuid>.
 */
export default function CommentsSection({
  contentId,
  slug,
}: {
  contentId: string;
  slug: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAuthenticated = Boolean(getAccessToken());

  const [body, setBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBodyById, setReplyBodyById] = useState<Record<string, string>>({});
  const [collapsedById, setCollapsedById] = useState<Record<string, boolean>>({});

  // Single pending reply ID — driven directly by mutation state + parentId,
  // not a parallel useState. We track which parentId is currently submitting.
  const [activePendingParentId, setActivePendingParentId] = useState<string | null>(null);

  const commentsQuery = useQuery<CommentItem[]>({
    queryKey: ["content", contentId, "comments"],
    queryFn: () => api.comments(contentId),
  });

  const createMutation = useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: string | null }) =>
      api.createComment(contentId, { body, parent_id: parentId ?? undefined }),
    onSuccess: (_data, vars) => {
      setBody("");
      setReplyToId(null);
      if (vars.parentId) {
        setReplyBodyById((prev) => ({ ...prev, [vars.parentId!]: "" }));
      }
      setActivePendingParentId(null);
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "counts"] });
    },
    onError: () => setActivePendingParentId(null),
  });

  const likeMutation = useMutation<void, ApiError, { commentId: string; liked: boolean }>({
    mutationFn: async ({ commentId, liked }) => {
      if (liked) {
        await api.unlikeComment(commentId);
      } else {
        await api.likeComment(commentId);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "counts"] });
    },
  });

  function goToLogin() {
    router.push(`/login?next=${encodeURIComponent(`/read/${slug}`)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    if (!isAuthenticated) { goToLogin(); return; }
    createMutation.mutate({ body: trimmed, parentId: null });
  }

  function handleReplySubmit(parentId: string) {
    const text = (replyBodyById[parentId] ?? "").trim();
    if (!text) return;
    if (!isAuthenticated) { goToLogin(); return; }
    setActivePendingParentId(parentId);
    createMutation.mutate({ body: text, parentId });
  }

  const tree = useMemo(() => buildTree(commentsQuery.data ?? []), [commentsQuery.data]);

  const mutationError =
    createMutation.error instanceof ApiError
      ? createMutation.error.detail
      : likeMutation.error instanceof ApiError
        ? likeMutation.error.detail
        : "Could not post comment.";

  // ── Context value — stable shape, no prop drilling ────────────────────────

  const ctxValue: CommentsCtx = {
    contentId,
    isAuthenticated,
    goToLogin,
    replyToId,
    setReplyToId,
    replyBodyById,
    setReplyBody: (id, value) =>
      setReplyBodyById((prev) => ({ ...prev, [id]: value })),
    collapsedById,
    toggleCollapsed: (id, current) =>
      setCollapsedById((prev) => ({ ...prev, [id]: !current })),
    openReply: (id) => {
      setReplyToId((current) => (current === id ? null : id));
      setCollapsedById((prev) => ({ ...prev, [id]: false }));
    },
    onReplySubmit: handleReplySubmit,
    onToggleLike: (commentId, liked) => likeMutation.mutate({ commentId, liked }),
    pendingLikeId: likeMutation.isPending ? (likeMutation.variables?.commentId ?? null) : null,
    pendingReplyId: createMutation.isPending ? activePendingParentId : null,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <CommentsContext.Provider value={ctxValue}>
      <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">Discussion</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Community comments</h2>
        </div>

        {/* Guest nudge */}
        {!isAuthenticated ? (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Sign in to post, reply, or like comments.
          </div>
        ) : null}

        {/* Compose form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder={isAuthenticated ? "Share your thoughts…" : "Login to comment…"}
            disabled={!isAuthenticated}
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-white/30 disabled:opacity-50"
          />

          {createMutation.isError || likeMutation.isError ? (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {mutationError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending || !isAuthenticated}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
            >
              {createMutation.isPending && !activePendingParentId ? "Posting…" : "Post comment"}
            </button>
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={goToLogin}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
              >
                Login to comment
              </button>
            ) : null}
          </div>
        </form>

        {/* Thread */}
        <div className="mt-6 space-y-4">
          {tree.length === 0 ? (
            <p className="text-sm text-white/45">No comments yet. Start the discussion.</p>
          ) : (
            tree.map((node) => (
              <CommentNodeView key={node.id} node={node} depth={0} />
            ))
          )}
        </div>
      </section>
    </CommentsContext.Provider>
  );
}