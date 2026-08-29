"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";

import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { useAuthSession } from "@/hooks/useAuthSession";
import { isAdminTier } from "@/lib/roles";
import type { EventType } from "@/lib/types";

function typeLabel(type: EventType) {
  if (type === "COMPETITION") return "Competition";
  if (type === "WORKSHOP") return "Workshop";
  return "Book club";
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuthSession();
  const queryClient = useQueryClient();

  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");

  const eventQuery = useQuery({
    queryKey: ["events", params.slug],
    queryFn: () => api.eventDetail(params.slug),
    enabled: Boolean(params.slug),
  });

  const event = eventQuery.data;

  const myParticipationQuery = useQuery({
    queryKey: ["events", event?.id, "me"],
    queryFn: () => api.myEventParticipation(event!.id),
    enabled: Boolean(event?.id) && isAuthenticated,
  });

  const isHost = Boolean(user && event && event.host_id === user.id);
  const canManage = isHost || isAdminTier(user);

  const participantsQuery = useQuery({
    queryKey: ["events", event?.id, "participants"],
    queryFn: () => api.eventParticipants(event!.id),
    enabled: Boolean(event?.id) && canManage,
  });

  function invalidateEvent() {
    queryClient.invalidateQueries({ queryKey: ["events", params.slug] });
    queryClient.invalidateQueries({ queryKey: ["events", event?.id] });
  }

  const rsvpMutation = useMutation({
    mutationFn: () => api.rsvpToEvent(event!.id),
    onSuccess: invalidateEvent,
  });

  const withdrawMutation = useMutation({
    mutationFn: () => api.withdrawFromEvent(event!.id),
    onSuccess: invalidateEvent,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.submitEventEntry(event!.id, {
        note: submissionNote || undefined,
        url: submissionUrl || undefined,
      }),
    onSuccess: invalidateEvent,
  });

  const attendMutation = useMutation({
    mutationFn: (userId: string) => api.markEventParticipantAttended(event!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", event?.id, "participants"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (userId: string) => api.markEventParticipantCompleted(event!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", event?.id, "participants"] });
    },
  });

  if (eventQuery.isLoading) {
    return <LoadingState label="Loading event..." />;
  }

  if (eventQuery.isError || !event) {
    return (
      <div className="rounded-[2rem] border border-danger/30 bg-danger-soft p-6 text-danger">
        This event could not be found.
      </div>
    );
  }

  const myParticipation = myParticipationQuery.data ?? null;
  const rsvpErrorDetail =
    rsvpMutation.error instanceof ApiError ? rsvpMutation.error.detail : null;

  const canRsvp = event.status === "PUBLISHED" || event.status === "ONGOING";
  const hasRsvped = myParticipation && myParticipation.status !== "WITHDREW";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
        <div className="kanga" />
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text">
              {typeLabel(event.type)}
            </span>
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-fg-dim">
              {event.status}
            </span>
            {event.student_only ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-fg-dim">
                <GraduationCap className="h-3 w-3" />
                Students only
              </span>
            ) : null}
          </div>

          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            {event.title}
          </h1>

          {event.description ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
              {event.description}
            </p>
          ) : null}

          {event.curriculum_tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {event.curriculum_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg-dim"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-fg-dim">
            {event.starts_at ? (
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDateTime(event.starts_at)}
              </span>
            ) : null}
            {event.max_participants ? (
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                Up to {event.max_participants} participants
              </span>
            ) : null}
          </div>

          {/* RSVP action */}
          <div className="mt-6">
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
              >
                Login to RSVP
              </Link>
            ) : hasRsvped ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success-soft px-5 py-3 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {myParticipation!.status === "ATTENDED"
                    ? "Attended"
                    : myParticipation!.status === "SUBMITTED"
                      ? "Submitted"
                      : myParticipation!.status === "COMPLETED"
                        ? "Completed"
                        : "You're going"}
                </span>
                <span className="text-xs text-fg-dim">
                  +{myParticipation!.xp_awarded} XP earned
                </span>
                <button
                  type="button"
                  onClick={() => withdrawMutation.mutate()}
                  disabled={withdrawMutation.isPending}
                  className="rounded-2xl border border-border bg-surface px-4 py-2 text-xs text-fg-dim hover:bg-surface-2 disabled:opacity-60"
                >
                  Withdraw
                </button>
              </div>
            ) : canRsvp ? (
              <button
                type="button"
                onClick={() => rsvpMutation.mutate()}
                disabled={rsvpMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {rsvpMutation.isPending ? "RSVPing..." : "RSVP · earn 5 XP"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-5 py-3 text-sm text-fg-dim">
                <Lock className="h-4 w-4" />
                RSVPs are closed for this event
              </span>
            )}

            {rsvpErrorDetail ? (
              <p className="mt-3 max-w-md text-sm text-danger">{rsvpErrorDetail}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Competition submission */}
      {event.type === "COMPETITION" && hasRsvped && myParticipation!.status !== "WITHDREW" ? (
        <section className="rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent-text" />
            <h2 className="font-display text-xl font-semibold">Submit your entry</h2>
          </div>
          <p className="mt-2 text-sm text-fg-dim">
            {myParticipation!.status === "SUBMITTED"
              ? "You've already submitted — you can update it below."
              : "Submitting earns you 50 XP."}
          </p>

          <div className="mt-4 grid gap-3">
            <textarea
              value={submissionNote}
              onChange={(e) => setSubmissionNote(e.target.value)}
              rows={4}
              placeholder="Describe your entry..."
              className="w-full resize-none rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
            />
            <input
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              placeholder="Link to your work (optional)"
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
            />
          </div>

          <button
            type="button"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || (!submissionNote && !submissionUrl)}
            className="mt-4 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-60"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit entry"}
          </button>
        </section>
      ) : null}

      {/* Host management panel */}
      {canManage ? (
        <section className="rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
                Host controls
              </p>
              <h2 className="font-display mt-2 text-xl font-semibold">Participants</h2>
            </div>
          </div>

          {participantsQuery.isLoading ? (
            <div className="mt-4">
              <LoadingState label="Loading participants..." />
            </div>
          ) : null}

          {participantsQuery.data && participantsQuery.data.length > 0 ? (
            <div className="mt-4 space-y-2">
              {participantsQuery.data.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-fg">{p.user_id}</p>
                    <p className="text-xs text-fg-dim">
                      {p.status} · {p.xp_awarded} XP
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => attendMutation.mutate(p.user_id)}
                      disabled={attendMutation.isPending || p.status === "ATTENDED"}
                      className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-fg-dim hover:bg-surface-2 disabled:opacity-40"
                    >
                      Mark attended
                    </button>
                    {event.type !== "COMPETITION" ? (
                      <button
                        type="button"
                        onClick={() => completeMutation.mutate(p.user_id)}
                        disabled={completeMutation.isPending || p.status === "COMPLETED"}
                        className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-fg-dim hover:bg-surface-2 disabled:opacity-40"
                      >
                        Mark completed
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-fg-dim">No participants yet.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
