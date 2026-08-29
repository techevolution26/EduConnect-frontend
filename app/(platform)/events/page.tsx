"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, GraduationCap, Trophy, Users } from "lucide-react";
import Link from "next/link";

import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { canHostEvents } from "@/lib/roles";
import { useAuthSession } from "@/hooks/useAuthSession";
import type { EventType } from "@/lib/types";

const typeFilters: Array<{ label: string; value: EventType | ""; icon: typeof Trophy }> = [
  { label: "All events", value: "", icon: CalendarDays },
  { label: "Competitions", value: "COMPETITION", icon: Trophy },
  { label: "Workshops", value: "WORKSHOP", icon: GraduationCap },
  { label: "Book clubs", value: "BOOK_CLUB", icon: Users },
];

function typeLabel(type: EventType) {
  if (type === "COMPETITION") return "Competition";
  if (type === "WORKSHOP") return "Workshop";
  return "Book club";
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventsPage() {
  const { user } = useAuthSession();
  const [typeFilter, setTypeFilter] = useState<EventType | "">("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", typeFilter],
    queryFn: () => api.events({ limit: 30, type: typeFilter || undefined }),
  });

  const events = data?.items ?? [];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
        <div className="kanga" />
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent-text">
              Events
            </p>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Competitions, workshops, and book clubs.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
              Join curriculum-aligned events hosted by writers and teachers.
              RSVP, attend, and earn XP toward the leaderboard.
            </p>
          </div>

          {canHostEvents(user) ? (
            <div className="rounded-[2rem] border border-border bg-surface-2 p-5">
              <p className="text-sm font-semibold text-fg">Host an event</p>
              <p className="mt-2 text-xs text-fg-dim">
                Run a competition, workshop, or book club for your readers.
              </p>
              <Link
                href="/writer/events/create"
                className="mt-4 inline-flex rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:opacity-90"
              >
                Create event
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {typeFilters.map((filter) => {
          const Icon = filter.icon;
          const active = typeFilter === filter.value;
          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm transition ${
                active
                  ? "bg-accent text-on-accent"
                  : "border border-border bg-surface text-fg-dim hover:bg-surface-2"
              }`}
            >
              <Icon className="h-4 w-4" />
              {filter.label}
            </button>
          );
        })}
      </div>

      {isLoading ? <LoadingState label="Loading events..." /> : null}

      {isError ? (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          Could not load events.
        </div>
      ) : null}

      {!isLoading && !isError && events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Check back soon, or host your own if you're a writer or teacher."
        />
      ) : null}

      {events.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="rounded-[2rem] border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-surface-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text">
                  {typeLabel(event.type)}
                </span>
                {event.student_only ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-fg-dim">
                    <GraduationCap className="h-3 w-3" />
                    Students
                  </span>
                ) : null}
              </div>

              <h2 className="font-display mt-4 text-xl font-semibold text-fg">
                {event.title}
              </h2>

              {event.description ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-fg-dim">
                  {event.description}
                </p>
              ) : null}

              {event.curriculum_tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {event.curriculum_tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-fg-dim"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {event.starts_at ? (
                <p className="mt-4 text-xs text-fg-dim">
                  Starts {formatDate(event.starts_at)}
                </p>
              ) : null}
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}
