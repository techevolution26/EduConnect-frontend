"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import { api, ApiError } from "@/lib/api";

export default function CommentsSection({ contentId }: { contentId: string }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const commentsQuery = useQuery({
    queryKey: ["content", contentId, "comments"],
    queryFn: () => api.comments(contentId),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createComment(contentId, { body }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({
        queryKey: ["content", contentId, "comments"],
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    createMutation.mutate();
  }

  const error =
    createMutation.error instanceof ApiError
      ? createMutation.error.detail
      : "Could not post comment.";

  return (
    <section className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-xl font-semibold">Discussion</h2>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder="Share your thoughts..."
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-white/30"
        />

        {createMutation.isError ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {createMutation.isPending ? "Posting..." : "Post comment"}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {commentsQuery.data?.map((comment) => (
          <article
            key={comment.id}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <p className="text-sm leading-6 text-white/75">{comment.body}</p>
            <p className="mt-2 text-xs text-white/35">
              {new Date(comment.created_at).toLocaleString()}
            </p>
          </article>
        ))}

        {commentsQuery.data && commentsQuery.data.length === 0 ? (
          <p className="text-sm text-white/45">
            No comments yet. Start the discussion.
          </p>
        ) : null}
      </div>
    </section>
  );
}