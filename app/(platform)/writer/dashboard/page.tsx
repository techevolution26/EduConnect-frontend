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
  Wallet,
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
    DRAFT: "border border-border bg-surface-2 text-fg-dim",
    PENDING_REVIEW:
      "border border-accent/30 bg-accent-soft text-accent",
    PUBLISHED:
      "border border-success/30 bg-success-soft text-success",
    REJECTED: "border border-danger/30 bg-danger-soft text-danger",
    ARCHIVED: "border border-border bg-surface-2 text-fg-dim",
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
    default: "border-border bg-surface",
    warm: "border-accent/30 bg-accent-soft",
    cool: "border-info/30 bg-info/10",
    green: "border-success/30 bg-success-soft",
    rose: "border-danger/30 bg-danger-soft",
  };

  return (
    <div
      className={`rounded-[2rem] border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${toneMap[tone]}`}
    >
      <p className="text-sm text-fg-dim">{label}</p>
      <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-fg">
        {value}
      </h2>
      {helper ? <p className="mt-2 text-xs leading-5 text-fg-dim">{helper}</p> : null}
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
    warm: "from-accent/15 via-accent/5 to-transparent",
    cool: "from-info/15 via-info/5 to-transparent",
    green: "from-success/15 via-success/5 to-transparent",
    rose: "from-danger/15 via-danger/5 to-transparent",
  };

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[2rem] border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-surface-2"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br opacity-70 ${accentMap[accent]}`}
      />
      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-2 text-fg-dim">
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="font-display mt-4 text-lg font-semibold text-fg">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-fg-dim">{description}</p>

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-fg-dim transition group-hover:text-fg">
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
      className="group relative overflow-hidden rounded-[2rem] border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-surface-2"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs ${statusClass(content.status)}`}>
            {content.status}
          </span>

          <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-fg-dim">
            {content.content_type}
          </span>

          <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-fg-dim">
            {content.visibility}
          </span>

          {content.is_featured ? (
            <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              Featured
            </span>
          ) : null}
        </div>

        <h3 className="font-display mt-4 text-xl font-semibold tracking-tight text-fg">
          {content.title}
        </h3>

        {content.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-fg-dim">
            {content.excerpt}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-fg-dim">
            No excerpt yet.
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-fg-dim">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {content.reading_time_minutes ?? 0} min read
          </span>

          <span className="text-fg-dim">Manage →</span>
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

  const referralSummaryQuery = useQuery({
    queryKey: ["partnerships", "referrals", "summary"],
    queryFn: api.myReferralSummary,
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
    <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-8 pb-10">
        <section className="overflow-hidden rounded-[2rem] border border-border bg-surface">
          <div className="kanga" />

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">
                Writer Studio
              </p>

              <h1 className="font-display mt-3 font-display text-3xl tracking-tight text-fg sm:text-5xl">
                Welcome, {user?.full_name ?? "Creator"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-dim sm:text-base">
                Create, refine, and manage your publishing workflow. Drafts can
                move to review, then become public once approved.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/writer/publish"
                  className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:scale-[1.01] hover:opacity-90"
                >
                  Create new content
                </Link>

                <Link
                  href="/writer/events/create"
                  className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim transition hover:bg-surface-2 hover:text-fg"
                >
                  Host an event
                </Link>

                <Link
                  href="/feed"
                  className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim transition hover:bg-surface-2 hover:text-fg"
                >
                  View public feed
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-surface-2 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-accent/80" />
                <h2 className="font-display font-semibold text-fg">Your workspace</h2>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-fg-dim">
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

        {/* Referral earnings -- turns sharing your partnership link into
            real income. See backend services/monetization_service.py. */}
        {referralSummaryQuery.data ? (
          <section className="rounded-[2rem] border border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-accent-text" />
              <h2 className="font-display text-xl font-semibold">Referral earnings</h2>
            </div>
            <p className="mt-2 text-sm text-fg-dim">
              You earn 10% commission when someone you refer buys a partnership.
              Share your profile link to start earning.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs text-fg-dim">Pending</p>
                <p className="mt-1 text-xl font-semibold text-fg">
                  KES {referralSummaryQuery.data.pending_kes.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs text-fg-dim">Paid out</p>
                <p className="mt-1 text-xl font-semibold text-fg">
                  KES {referralSummaryQuery.data.paid_kes.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs text-fg-dim">Total referrals</p>
                <p className="mt-1 text-xl font-semibold text-fg">
                  {referralSummaryQuery.data.total_referrals}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-border bg-surface p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
                Account summary
              </p>

              <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-fg">
                Your role and access
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-dim">
                Your publishing permissions are based on this role.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm text-fg-dim">
              <Users className="h-4 w-4 text-fg-dim" />
              {user?.role ?? "Unknown"}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-surface p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
                My content
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-fg">
                Publishing queue
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-2xl px-4 py-2 text-sm transition ${statusFilter === tab.value
                    ? "bg-accent text-on-accent"
                    : "border border-border bg-surface text-fg-dim hover:bg-surface-2 hover:text-fg"
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
            <p className="mt-5 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
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