"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Medal, Trophy } from "lucide-react";

import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { useAuthSession } from "@/hooks/useAuthSession";

function rankColor(rank: number) {
  if (rank === 1) return "text-amber-400";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-amber-700";
  return "text-fg-dim";
}

export default function LeaderboardPage() {
  const { isAuthenticated } = useAuthSession();
  const [period, setPeriod] = useState<"all_time" | "month">("all_time");

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => api.leaderboard({ period, limit: 50 }),
  });

  const myXPQuery = useQuery({
    queryKey: ["leaderboard", "me"],
    queryFn: api.myXP,
    enabled: isAuthenticated,
  });

  const myBadgesQuery = useQuery({
    queryKey: ["leaderboard", "me", "badges"],
    queryFn: api.myBadges,
    enabled: isAuthenticated,
  });

  const entries = leaderboardQuery.data?.entries ?? [];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
        <div className="kanga" />
        <div className="p-5 sm:p-6 lg:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-accent-text">
            Leaderboard
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Top participants across the ecosystem
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
            Earn XP by RSVPing, attending, and completing events. Compete for a
            spot on the leaderboard.
          </p>

          {isAuthenticated && myXPQuery.data ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3">
                <p className="text-xs text-fg-dim">Your XP</p>
                <p className="mt-1 text-xl font-semibold text-fg">
                  {myXPQuery.data.total_xp}
                </p>
              </div>
              {myXPQuery.data.rank ? (
                <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3">
                  <p className="text-xs text-fg-dim">Your rank</p>
                  <p className="mt-1 text-xl font-semibold text-fg">
                    #{myXPQuery.data.rank}
                  </p>
                </div>
              ) : null}
              {myXPQuery.data.school_rank ? (
                <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3">
                  <p className="text-xs text-fg-dim">School rank</p>
                  <p className="mt-1 text-xl font-semibold text-fg">
                    #{myXPQuery.data.school_rank}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex gap-2">
        {(["all_time", "month"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-2xl px-4 py-2 text-sm transition ${
              period === p
                ? "bg-accent text-on-accent"
                : "border border-border bg-surface text-fg-dim hover:bg-surface-2"
            }`}
          >
            {p === "all_time" ? "All time" : "This month"}
          </button>
        ))}
      </div>

      {leaderboardQuery.isLoading ? <LoadingState label="Loading leaderboard..." /> : null}

      {!leaderboardQuery.isLoading && entries.length === 0 ? (
        <EmptyState
          title="No XP earned yet"
          description="Be the first — RSVP to an event to start earning XP."
        />
      ) : null}

      {entries.length > 0 ? (
        <section className="overflow-hidden rounded-[2rem] border border-border bg-surface">
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div
                key={entry.user_id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 text-lg font-bold ${rankColor(entry.rank)}`}>
                    {entry.rank <= 3 ? <Trophy className="h-5 w-5" /> : `#${entry.rank}`}
                  </span>
                  <p className="font-medium text-fg">
                    {entry.full_name ?? "Anonymous"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-fg">{entry.total_xp} XP</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {isAuthenticated && myBadgesQuery.data && myBadgesQuery.data.length > 0 ? (
        <section className="rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent-text" />
            <h2 className="font-display text-xl font-semibold">Your badges</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myBadgesQuery.data.map(({ badge, awarded_at }) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
                  <Medal className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{badge.name}</p>
                  <p className="text-xs text-fg-dim">
                    +{badge.xp_reward} XP · {new Date(awarded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
