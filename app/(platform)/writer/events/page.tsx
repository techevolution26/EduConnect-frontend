"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import type { EventType } from "@/lib/types";

function typeLabel(type: EventType) {
  if (type === "COMPETITION") return "Competition";
  if (type === "WORKSHOP") return "Workshop";
  return "Book club";
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    DRAFT: "bg-surface-2 text-fg-dim",
    PUBLISHED: "bg-success-soft text-success",
    ONGOING: "bg-accent-soft text-accent-text",
    COMPLETED: "bg-surface-2 text-fg-dim",
    CANCELLED: "bg-danger-soft text-danger",
  };
  return map[status] ?? "bg-surface-2 text-fg-dim";
}

export default function MyEventsPage() {
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => api.myHostedEvents({ limit: 50 }),
  });

  const publishMutation = useMutation({
    mutationFn: (eventId: string) => api.publishEvent(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events", "mine"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (eventId: string) => api.cancelEvent(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events", "mine"] }),
  });

  const events = eventsQuery.data?.items ?? [];

  return (
    <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-[2rem] border border-border bg-surface p-6 shadow-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
              Writer Studio
            </p>
            <h1 className="font-display mt-2 text-2xl font-semibold text-fg sm:text-3xl">
              My events
            </h1>
          </div>
          <Link
            href="/writer/events/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New event
          </Link>
        </section>

        {eventsQuery.isLoading ? <LoadingState label="Loading your events..." /> : null}

        {!eventsQuery.isLoading && events.length === 0 ? (
          <EmptyState
            title="You haven't hosted any events yet"
            description="Create a competition, workshop, or book club to start building relationships with students."
          />
        ) : null}

        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs ${statusClass(event.status)}`}>
                      {event.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-fg-dim">
                      <CalendarDays className="h-3 w-3" />
                      {typeLabel(event.type)}
                    </span>
                  </div>
                  <Link
                    href={`/events/${event.slug}`}
                    className="mt-2 block font-medium text-fg hover:underline"
                  >
                    {event.title}
                  </Link>
                </div>

                <div className="flex shrink-0 gap-2">
                  {event.status === "DRAFT" ? (
                    <button
                      type="button"
                      onClick={() => publishMutation.mutate(event.id)}
                      disabled={publishMutation.isPending}
                      className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-60"
                    >
                      Publish
                    </button>
                  ) : null}
                  {event.status !== "CANCELLED" && event.status !== "COMPLETED" ? (
                    <button
                      type="button"
                      onClick={() => cancelMutation.mutate(event.id)}
                      disabled={cancelMutation.isPending}
                      className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-2 text-sm font-semibold text-danger disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
