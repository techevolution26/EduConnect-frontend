"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CornerDownRight, Heart } from "lucide-react";
import {
  FormEvent,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

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

type CommentNode = CommentItem & {
  children: CommentNode[];
};

function getAuthorLabel(comment: CommentItem) {
  return comment.user?.full_name || comment.user?.username || "Anonymous";
}

function getInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatCommentDate(value: string) {
  return new Date(value).toLocaleString();
}

function buildTree(items: CommentItem[]) {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const item of items) {
    byId.set(item.id, { ...item, children: [] });
  }

  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: CommentNode[]) => {
    nodes.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    for (const node of nodes) sortNodes(node.children);
  };

  sortNodes(roots);
  return roots;
}

function depthStyles(depth: number) {
  const card = [
    "border-border bg-surface-2",
    "border-border bg-surface",
    "border-info/20 bg-info/[0.04]",
    "border-danger/20 bg-danger/[0.05]",
    "border-accent/30 bg-accent/[0.05]",
  ];

  const rail = [
    "border-l-border",
    "border-l-info/30",
    "border-l-danger/30",
    "border-l-accent/30",
    "border-l-success/30",
  ];

  const idx = Math.min(depth, card.length - 1);
  const isNested = depth > 0;

  return {
    card: card[idx],
    rail: rail[idx],
    wrapper: isNested ? "ml-1 sm:ml-4 border-l border-border pl-3 sm:pl-5" : "",
    avatar: isNested ? "h-9 w-9" : "h-10 w-10",
    meta: isNested ? "text-[11px] text-fg-dim" : "text-xs text-fg-dim",
    body: isNested ? "text-sm leading-6 text-fg-dim" : "text-sm leading-6 text-fg-dim",
    actions: isNested ? "mt-3" : "mt-4",
  };
}

function CommentNodeView({
  node,
  depth,
  replyToId,
  setReplyToId,
  replyBodyById,
  setReplyBodyById,
  onReplySubmit,
  onToggleLike,
  isAuthenticated,
  goToLogin,
  pendingLikeId,
  pendingReplyId,
  collapsedById,
  setCollapsedById,
}: {
  node: CommentNode;
  depth: number;
  replyToId: string | null;
  setReplyToId: Dispatch<SetStateAction<string | null>>;
  replyBodyById: Record<string, string>;
  setReplyBodyById: Dispatch<SetStateAction<Record<string, string>>>;
  onReplySubmit: (commentId: string) => void;
  onToggleLike: (commentId: string, liked: boolean) => void;
  isAuthenticated: boolean;
  goToLogin: () => void;
  pendingLikeId: string | null;
  pendingReplyId: string | null;
  collapsedById: Record<string, boolean>;
  setCollapsedById: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  const authorLabel = getAuthorLabel(node);
  const initials = getInitials(authorLabel);
  const styles = depthStyles(depth);
  const hasChildren = node.children.length > 0;
  const isReplyOpen = replyToId === node.id;

  // Root comments stay open. Nested replies start collapsed by default.
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
          <div
            className={[
              "shrink-0 rounded-full border border-border bg-surface text-xs font-semibold text-fg-dim",
              "flex items-center justify-center",
              styles.avatar,
            ].join(" ")}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">
                  {authorLabel}
                </p>
                {node.user?.username ? (
                  <p className={styles.meta}>@{node.user.username}</p>
                ) : null}
              </div>

              <p className={styles.meta}>{formatCommentDate(node.created_at)}</p>
            </div>

            <p className={`mt-3 ${styles.body}`}>{node.body}</p>

            <div className={styles.actions}>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      goToLogin();
                      return;
                    }
                    onToggleLike(node.id, Boolean(node.liked_by_me));
                  }}
                  disabled={pendingLikeId === node.id}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                    node.liked_by_me
                      ? "border-danger/30 bg-danger-soft text-danger"
                      : "border-border bg-surface text-fg-dim hover:bg-surface-2",
                    "disabled:opacity-60",
                  ].join(" ")}
                >
                  <Heart
                    className={[
                      "h-3.5 w-3.5",
                      node.liked_by_me ? "fill-current" : "",
                    ].join(" ")}
                  />
                  <span>{node.likes_count ?? 0}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      goToLogin();
                      return;
                    }
                    setReplyToId((current) => (current === node.id ? null : node.id));
                    setCollapsedById((current) => ({
                      ...current,
                      [node.id]: false,
                    }));
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-fg-dim hover:bg-surface-2"
                >
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Reply
                </button>

                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedById((current) => ({
                        ...current,
                        [node.id]: !isCollapsed,
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-fg-dim hover:bg-surface-2"
                  >
                    {isCollapsed ? "Show replies" : "Hide replies"}
                    <span className="text-fg-dim">({node.children.length})</span>
                  </button>
                ) : null}
              </div>
            </div>

            {isReplyOpen ? (
              <div className="mt-4 rounded-2xl border border-border bg-surface p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-fg-dim">
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Replying to {authorLabel}
                </div>

                <textarea
                  value={replyBodyById[node.id] ?? ""}
                  onChange={(event) =>
                    setReplyBodyById((current) => ({
                      ...current,
                      [node.id]: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Write a reply..."
                  className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-fg outline-none placeholder:text-fg-dim/70 focus:border-accent/40"
                />

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onReplySubmit(node.id)}
                    disabled={pendingReplyId === node.id}
                    className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-60"
                  >
                    {pendingReplyId === node.id ? "Posting..." : "Post reply"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyToId(null)}
                    className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {hasChildren && !isCollapsed ? (
        <div className="mt-4 space-y-3">
          {node.children.map((child) => (
            <CommentNodeView
              key={child.id}
              node={child}
              depth={depth + 1}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyBodyById={replyBodyById}
              setReplyBodyById={setReplyBodyById}
              onReplySubmit={onReplySubmit}
              onToggleLike={onToggleLike}
              isAuthenticated={isAuthenticated}
              goToLogin={goToLogin}
              pendingLikeId={pendingLikeId}
              pendingReplyId={pendingReplyId}
              collapsedById={collapsedById}
              setCollapsedById={setCollapsedById}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CommentsSection({ contentId }: { contentId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [body, setBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBodyById, setReplyBodyById] = useState<Record<string, string>>({});
  const [pendingLikeId, setPendingLikeId] = useState<string | null>(null);
  const [pendingReplyId, setPendingReplyId] = useState<string | null>(null);
  const [collapsedById, setCollapsedById] = useState<Record<string, boolean>>({});

  const isAuthenticated = Boolean(getAccessToken());

  const commentsQuery = useQuery<CommentItem[]>({
    queryKey: ["content", contentId, "comments"],
    queryFn: () => api.comments(contentId),
  });

  const createMutation = useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: string | null }) =>
      api.createComment(contentId, {
        body,
        parent_id: parentId ?? undefined,
      }),
    onSuccess: () => {
      setBody("");
      setReplyToId(null);
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "counts"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ commentId, liked }: { commentId: string; liked: boolean }) => {
      if (liked) return api.unlikeComment(commentId);
      return api.likeComment(commentId);
    },
    onMutate: ({ commentId }) => setPendingLikeId(commentId),
    onSettled: () => {
      setPendingLikeId(null);
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["content", contentId, "counts"] });
    },
  });

  function goToLogin() {
    router.push(`/login?next=${encodeURIComponent(`/read/${contentId}`)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    createMutation.mutate({ body: trimmed, parentId: null });
  }

  function handleReplySubmit(parentId: string) {
    const replyText = (replyBodyById[parentId] ?? "").trim();
    if (!replyText) return;

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    setPendingReplyId(parentId);
    createMutation.mutate(
      { body: replyText, parentId },
      {
        onSuccess: () => {
          setReplyBodyById((current) => ({ ...current, [parentId]: "" }));
          setPendingReplyId(null);
        },
        onError: () => setPendingReplyId(null),
      },
    );
  }

  const error =
    createMutation.error instanceof ApiError
      ? createMutation.error.detail
      : likeMutation.error instanceof ApiError
        ? likeMutation.error.detail
        : "Could not post comment.";

  const tree = useMemo(() => buildTree(commentsQuery.data ?? []), [commentsQuery.data]);

  return (
    <section className="mt-8 rounded-[2rem] border border-border bg-surface p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-fg-dim">
            Discussion
          </p>
          <h2 className="font-display mt-2 text-xl font-semibold text-fg">
            Community comments
          </h2>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="mt-4 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          Sign in to post, reply, or like comments.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder={isAuthenticated ? "Share your thoughts..." : "Login to comment..."}
          className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-fg outline-none placeholder:text-fg-dim/70 focus:border-accent/40"
          disabled={!isAuthenticated}
        />

        {createMutation.isError || likeMutation.isError ? (
          <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending || !isAuthenticated}
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent disabled:opacity-60"
          >
            {createMutation.isPending ? "Posting..." : "Post comment"}
          </button>

          {!isAuthenticated ? (
            <button
              type="button"
              onClick={goToLogin}
              className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
            >
              Login to comment
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {tree.map((node) => (
          <CommentNodeView
            key={node.id}
            node={node}
            depth={0}
            replyToId={replyToId}
            setReplyToId={setReplyToId}
            replyBodyById={replyBodyById}
            setReplyBodyById={setReplyBodyById}
            onReplySubmit={handleReplySubmit}
            onToggleLike={(commentId, liked) => likeMutation.mutate({ commentId, liked })}
            isAuthenticated={isAuthenticated}
            goToLogin={goToLogin}
            pendingLikeId={pendingLikeId}
            pendingReplyId={pendingReplyId}
            collapsedById={collapsedById}
            setCollapsedById={setCollapsedById}
          />
        ))}

        {tree.length === 0 ? (
          <p className="text-sm text-fg-dim">No comments yet. Start the discussion.</p>
        ) : null}
      </div>
    </section>
  );
}