"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Clock3,
  HeartHandshake,
  MessageSquareText,
  PenLine,
  Sparkles,
  Users,
} from "lucide-react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type { ContentStatus } from "@/lib/types";

const statusTabs: Array<{ label: string; value: ContentStatus | "" }> = [
  { label: "All", value: "" },
  { label: "Drafts", value: "DRAFT" },
  { label: "Pending", value: "PENDING_REVIEW" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Rejected", value: "REJECTED" },
];

function statusClass(status: ContentStatus) {
  const map: Record<ContentStatus, string> = {
    DRAFT: "border border-slate-500/30 bg-slate-500/10 text-slate-100",
    PENDING_REVIEW:
      "border border-amber-400/30 bg-amber-400/10 text-amber-100",
    PUBLISHED:
      "border border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    REJECTED: "border border-rose-400/30 bg-rose-400/10 text-rose-100",
    ARCHIVED: "border border-zinc-500/30 bg-zinc-500/10 text-zinc-100",
  };

  return map[status];
}

function StatCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: number | string;
  helper?: string;
  tone?: "default" | "warm" | "cool" | "green" | "rose";
}) {
  const toneMap = {
    default: "border-white/10 bg-white/[0.04]",
    warm: "border-amber-400/20 bg-amber-400/10",
    cool: "border-cyan-400/20 bg-cyan-400/10",
    green: "border-emerald-400/20 bg-emerald-400/10",
    rose: "border-rose-400/20 bg-rose-400/10",
  };

  return (
    <div
      className={`rounded-[2rem] border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${toneMap[tone]}`}
    >
      <p className="text-sm text-white/45">{label}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {value}
      </h2>
      {helper ? <p className="mt-2 text-xs leading-5 text-white/40">{helper}</p> : null}
    </div>
  );
}

function StudioAction({
  href,
  title,
  description,
  icon: Icon,
  accent,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "warm" | "cool" | "green" | "rose";
}) {
  const accentMap = {
    warm: "from-amber-400/15 via-orange-400/10 to-transparent",
    cool: "from-cyan-400/15 via-sky-400/10 to-transparent",
    green: "from-emerald-400/15 via-teal-400/10 to-transparent",
    rose: "from-rose-400/15 via-fuchsia-400/10 to-transparent",
  };

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br opacity-70 ${accentMap[accent]}`}
      />
      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white/80">
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition group-hover:text-white">
          Open
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function ContentRow({
  content,
}: {
  content: {
    id: string;
    title: string;
    excerpt?: string | null;
    content_type: string;
    visibility: string;
    status: ContentStatus;
    reading_time_minutes?: number | null;
    is_featured?: boolean;
  };
}) {
  return (
    <Link
      href={`/writer/content/${content.id}/edit`}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_28%)] opacity-0 transition group-hover:opacity-100" />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs ${statusClass(content.status)}`}>
            {content.status}
          </span>

          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/45">
            {content.content_type}
          </span>

          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/45">
            {content.visibility}
          </span>

          {content.is_featured ? (
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
              Featured
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
          {content.title}
        </h3>

        {content.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
            {content.excerpt}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-white/35">
            No excerpt yet.
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {content.reading_time_minutes ?? 0} min read
          </span>

          <span className="text-white/70">Manage →</span>
        </div>
      </div>
    </Link>
  );
}

export default function WriterDashboardPage() {
  const user = getStoredUser();
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "">("");

  const myContentQuery = useQuery({
    queryKey: ["writer", "content", statusFilter],
    queryFn: () =>
      api.myContent({
        limit: 50,
        status_filter: statusFilter || undefined,
      }),
  });

  const analyticsQuery = useQuery({
    queryKey: ["writer", "analytics"],
    queryFn: api.writerAnalytics,
  });

  const items = myContentQuery.data?.items ?? [];

  const quickStats = useMemo(
    () => [
      {
        label: "Total content",
        value: analyticsQuery.data?.total_content ?? 0,
        helper: "Everything in your studio",
        tone: "cool" as const,
      },
      {
        label: "Published",
        value: analyticsQuery.data?.published ?? 0,
        helper: "Visible to readers",
        tone: "green" as const,
      },
      {
        label: "Pending review",
        value: analyticsQuery.data?.pending ?? 0,
        helper: "Waiting on moderation",
        tone: "warm" as const,
      },
      {
        label: "Followers",
        value: analyticsQuery.data?.followers ?? 0,
        helper: "Audience growth",
        tone: "rose" as const,
      },
    ],
    [analyticsQuery.data],
  );

  return (
    <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN"]}>
      <div className="space-y-8 pb-10">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-950 via-zinc-950 to-black p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_28%),radial-gradient(circle_at_center,rgba(14,165,233,0.08),transparent_34%)]" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                Writer Studio
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Welcome, {user?.full_name ?? "Creator"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
                Create, refine, and manage your publishing workflow. Drafts can
                move to review, then become public once approved.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/writer/publish"
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-white/90"
                >
                  Create new content
                </Link>

                <Link
                  href="/feed"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  View public feed
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-200/80" />
                <h2 className="font-semibold text-white">Your workspace</h2>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-white/60">
                <p>• Draft, publish, and resubmit content</p>
                <p>• Track moderation and creator performance</p>
                <p>• Build a polished publishing presence</p>
                <p>• Manage education, faith, and community content</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              tone={card.tone}
            />
          ))}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                Account summary
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Your role and access
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Your publishing permissions are based on this role.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/70">
              <Users className="h-4 w-4 text-white/40" />
              {user?.role ?? "Unknown"}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                My content
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Publishing queue
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-2xl px-4 py-2 text-sm transition ${
                    statusFilter === tab.value
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {myContentQuery.isLoading ? (
            <div className="mt-5">
              <LoadingState label="Loading your content..." />
            </div>
          ) : null}

          {myContentQuery.isError ? (
            <p className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              Could not load your content. Confirm the backend has
              GET /api/v1/content/mine.
            </p>
          ) : null}

          {!myContentQuery.isLoading && !myContentQuery.isError && items.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((content) => (
                <ContentRow key={content.id} content={content} />
              ))}
            </div>
          ) : null}

          {!myContentQuery.isLoading &&
          !myContentQuery.isError &&
          items.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No content found"
                description="Create your first draft or change the selected status filter."
              />
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StudioAction
            href="/writer/publish"
            title="Create content"
            description="Draft a new story, article, poem, or learning resource."
            icon={PenLine}
            accent="warm"
          />

          <StudioAction
            href="/education"
            title="Education"
            description="Attach learning resources and curriculum-focused material."
            icon={BookOpen}
            accent="cool"
          />

          <StudioAction
            href="/writers"
            title="Discover writers"
            description="Explore other creators and grow your audience network."
            icon={HeartHandshake}
            accent="green"
          />

          <StudioAction
            href="/notifications"
            title="Notifications"
            description="See approvals, comments, follows, and platform updates."
            icon={MessageSquareText}
            accent="rose"
          />
        </section>
      </div>
    </RoleGuard>
  );
}