"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";

import ContentCard from "@/components/content/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { Content, ContentType } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type FeedTab = "discover" | "for-you";
type FeedItem = Content;

type FeedStatus =
  | { type: "loading" }
  | { type: "error" }
  | { type: "login-gate" }
  | { type: "empty" }
  | { type: "ready"; items: FeedItem[]; featured: FeedItem | null };

// ─── Static data ──────────────────────────────────────────────────────────────

const contentTypeFilters: Array<{ label: string; value: ContentType | "" }> = [
  { label: "All", value: "" },
  { label: "Stories", value: "STORY" },
  { label: "Fiction", value: "FICTION" },
  { label: "Poetry", value: "POEM" },
  { label: "Faith", value: "FAITH" },
  { label: "Education", value: "EDUCATION" },
  { label: "Children", value: "CHILDREN" },
  { label: "News", value: "NEWS" },
  { label: "Audio", value: "AUDIO" },
  { label: "Writing tips", value: "WRITING_TIPS" },
  { label: "Self improvement", value: "SELF_IMPROVEMENT" },
  { label: "Relationship", value: "RELATIONSHIP" },
  { label: "Money / finance", value: "MONEY_FINANCE" },
  { label: "Medicine", value: "MEDICINE" },
  { label: "Psychology", value: "PSYCHOLOGY" },
  { label: "Mental health", value: "MENTAL_HEALTH" },
  { label: "Humor", value: "HUMOR" },
  { label: "Women", value: "WOMEN" },
  { label: "Fitness", value: "FITNESS" },
  { label: "Self awareness", value: "SELF_AWARENESS" },
  { label: "Parenting", value: "PARENTING" },
  { label: "Technology", value: "TECHNOLOGY" },
  { label: "Science", value: "SCIENCE" },
  { label: "Cars", value: "CARS" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function getCoverImageUrl(item: unknown): string | null {
  if (!item || typeof item !== "object") return null;
  const v = item as {
    cover_image_url?: string | null;
    cover_image?: string | null;
    cover_image_src?: string | null;
  };
  return v.cover_image_url ?? v.cover_image ?? v.cover_image_src ?? null;
}

function getCoverTone(item: unknown): string {
  if (!item || typeof item !== "object") return "#0f1117";
  const v = item as {
    cover_color?: string | null;
    accent_color?: string | null;
    hero_color?: string | null;
  };
  return v.cover_color ?? v.accent_color ?? v.hero_color ?? "#0f1117";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Quick-link card used in the guest view.
 */
function QuickLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-border bg-surface p-5 transition hover:border-accent/30 hover:bg-surface-2"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-border bg-surface-2 p-3 text-fg-dim transition group-hover:bg-accent-soft group-hover:text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold text-fg">
            {label}
          </h3>
          <p className="mt-1 text-sm leading-6 text-fg-dim">{description}</p>
        </div>
      </div>
    </Link>
  );
}

/**
 * Hero shown to unauthenticated visitors.
 */
function GuestHero() {
  return (
    <section className="relative grid gap-8 overflow-hidden rounded-[2rem] border border-border bg-surface p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:p-10">
      <div className="kanga" />

      <div className="relative">
        <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
          Reading ecosystem
        </p>
        <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          Discover stories, lessons, faith, and community voices.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-dim sm:text-base">
          A public window into African-centered storytelling, education,
          children-safe learning, faith content, and creator-led publishing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
          >
            Join the community
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg-dim transition hover:text-fg"
          >
            Login
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg-dim transition hover:text-fg"
          >
            <Search className="h-4 w-4" />
            Search ecosystem
          </Link>
        </div>
      </div>

      <div className="relative rounded-[2rem] border border-border bg-surface-2 p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-display font-semibold text-fg">
            What you can explore
          </h2>
        </div>
        <ul className="mt-4 grid gap-3 text-sm text-fg-dim">
          <li>Public stories, poems, faith posts, and lessons</li>
          <li>Hubs for shared interests and community discovery</li>
          <li>Partner-only content previews before joining</li>
          <li>Personalized feed after login</li>
        </ul>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            {
              label: "Public",
              value: "Open",
              helper: "Discovery feed is public",
            },
            {
              label: "Premium",
              value: "Partner",
              helper: "Supports creator earnings",
            },
            {
              label: "Safety",
              value: "Curated",
              helper: "Moderated and structured",
            },
          ].map(({ label, value, helper }) => (
            <div
              key={label}
              className="rounded-[1.25rem] border border-border bg-surface p-3"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-fg-dim">
                {label}
              </p>
              <p className="mt-1 font-display text-base font-semibold text-fg">
                {value}
              </p>
              <p className="mt-0.5 text-xs text-fg-dim">{helper}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Hero shown to authenticated users. Accepts an `onSwitchToForYou` callback
 * so the "See For you" button actually does something.
 */
function AuthHero({
  activeTab,
  spotlight,
  onSwitchToForYou,
}: {
  activeTab: FeedTab;
  spotlight: FeedItem | null;
  onSwitchToForYou: () => void;
}) {
  const coverUrl = getCoverImageUrl(spotlight);
  const tone = getCoverTone(spotlight);

  return (
    <article className="relative overflow-hidden rounded-[2.5rem] border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={
          coverUrl
            ? {
                backgroundImage: `linear-gradient(135deg, rgba(2,6,23,0.40), rgba(2,6,23,0.78)), url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                backgroundImage: `linear-gradient(135deg, ${tone}, #111827 55%, #020617)`,
              }
        }
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_28%)]" />

      {/* Content */}
      <div className="relative flex min-h-[36vh] flex-col justify-end p-6 sm:p-8 lg:min-h-[48vh] lg:p-10">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          {activeTab === "for-you" ? "Your feed" : "Featured content"}
        </div>

        <h1 className="mt-4 max-w-5xl font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl lg:text-6xl">
          {spotlight?.title ?? "Your content feed is ready"}
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-fg-dim sm:text-base">
          {spotlight?.excerpt ??
            "Fresh content from the ecosystem, shaped around what you follow, read, and join."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {spotlight ? (
            <Link
              href={`/read/${spotlight.slug}`}
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
            >
              Open featured content
            </Link>
          ) : null}

          {activeTab !== "for-you" ? (
            <button
              type="button"
              onClick={onSwitchToForYou}
              className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim transition hover:bg-surface-2"
            >
              See For you
            </button>
          ) : null}

          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim transition hover:bg-surface-2"
          >
            <Search className="h-4 w-4" />
            Search ecosystem
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Sticky tab + filter bar. Sticks to the top of the viewport after scrolling
 * past the hero. Filter pills only show when tab is "discover".
 */
function StickyFilterBar({
  activeTab,
  setActiveTab,
  contentType,
  setContentType,
}: {
  activeTab: FeedTab;
  setActiveTab: (tab: FeedTab) => void;
  contentType: ContentType | "";
  setContentType: (type: ContentType | "") => void;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 pb-2 pt-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 rounded-[2rem] border border-border bg-[rgba(255,255,255,0.04)] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] md:flex-row md:items-center md:justify-between">
        {/* Tabs */}
        <div className="flex shrink-0 gap-2">
          {(["discover", "for-you"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-accent text-on-accent"
                  : "border border-border bg-surface text-fg-dim hover:bg-surface-2"
              }`}
            >
              {tab === "discover" ? "Discover" : "For you"}
            </button>
          ))}
        </div>

        {/* Type filters — only on Discover tab */}
        {activeTab === "discover" ? (
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {contentTypeFilters.map((filter) => {
              const active = contentType === filter.value;
              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setContentType(filter.value)}
                  className={`shrink-0 rounded-2xl px-3.5 py-1.5 text-sm transition ${
                    active
                      ? "bg-accent-soft text-accent ring-1 ring-accent/30"
                      : "border border-border bg-surface text-fg-dim hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Featured story spotlight card — shown in Discover when there's a featured item.
 */
function FeaturedCard({ item }: { item: FeedItem }) {
  return (
    <article className="relative overflow-hidden rounded-[2.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] md:p-8 lg:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,115,0,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_32%)]" />
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-accent">
          Featured story
        </span>
        <h2 className="mt-6 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl lg:text-5xl">
          {item.title}
        </h2>
        {item.excerpt ? (
          <p className="mt-5 max-w-2xl text-sm leading-7 text-fg-dim sm:text-base">
            {item.excerpt}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/read/${item.slug}`}
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
          >
            Read featured story
          </Link>
          <Link
            href="/writers"
            className="rounded-2xl border border-border bg-surface px-5 py-3 text-sm text-fg-dim transition hover:bg-surface-2"
          >
            Explore writers
          </Link>
          {item.is_premium ? (
            <Link
              href="/partnership"
              className="rounded-2xl border border-accent/30 bg-accent-soft px-5 py-3 text-sm text-accent transition hover:opacity-80"
            >
              Partner content
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Renders the feed body based on a discriminated status union.
 */
function FeedGrid({
  status,
  activeTab,
}: {
  status: FeedStatus;
  activeTab: FeedTab;
}) {
  if (status.type === "loading") {
    return (
      <LoadingState
        label={
          activeTab === "for-you"
            ? "Loading your personalized feed…"
            : "Loading feed…"
        }
      />
    );
  }

  if (status.type === "error") {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
        Something went wrong while loading the feed. Refresh the page or try
        again later.
      </div>
    );
  }

  if (status.type === "login-gate") {
    return (
      <section className="rounded-[2rem] border border-accent/30 bg-accent-soft p-6">
        <h2 className="font-display text-xl font-semibold text-accent">
          Login to unlock your personalized feed
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-dim">
          Your For you feed is based on followed writers, joined hubs, reading
          behaviour, and your interests.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
          >
            Create account
          </Link>
        </div>
      </section>
    );
  }

  if (status.type === "empty") {
    return (
      <EmptyState
        title={
          activeTab === "for-you"
            ? "Your personalized feed is empty"
            : "No public content yet"
        }
        description={
          activeTab === "for-you"
            ? "Follow writers or join hubs to personalize this feed."
            : "Published content will appear here once approved. Explore hubs, writers, and education sections meanwhile."
        }
      />
    );
  }

  // status.type === "ready"
  const { items, featured } = status;
  const rest = featured ? items.filter((i) => i.id !== featured.id) : items;

  return (
    <div className="space-y-6">
      {/* Featured spotlight — Discover tab only */}
      {activeTab === "discover" && featured ? (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <FeaturedCard item={featured} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {rest.slice(0, 2).map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Main grid */}
      {rest.length > (activeTab === "discover" && featured ? 2 : 0) ? (
        <section className="space-y-4">
          {activeTab === "discover" && featured ? (
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
                Latest
              </p>
              <h2 className="mt-2 font-display text-2xl text-fg">
                Fresh from the ecosystem
              </h2>
            </div>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {(activeTab === "discover" && featured ? rest.slice(2) : rest).map(
              (content) => (
                <ContentCard key={content.id} content={content} />
              ),
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>("discover");
  const [contentType, setContentType] = useState<ContentType | "">("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const isAuthenticated = mounted ? Boolean(getAccessToken()) : false;

  // ── Queries ──────────────────────────────────────────────────────────────

  const discoverQuery = useQuery({
    queryKey: ["feed", "discover", contentType],
    queryFn: () =>
      api.discoverFeed({ limit: 30, content_type: contentType || undefined }),
  });

  const forYouQuery = useQuery({
    queryKey: ["feed", "for-you"],
    queryFn: () => api.forYouFeed(),
    enabled: mounted && isAuthenticated && activeTab === "for-you",
  });

  // ── Derived state ────────────────────────────────────────────────────────

  const discoverItems: FeedItem[] = discoverQuery.data?.items ?? [];
  const forYouItems: FeedItem[] = forYouQuery.data?.items ?? [];

  const feedItems = useMemo<FeedItem[]>(() => {
    return activeTab === "for-you" ? forYouItems : discoverItems;
  }, [activeTab, forYouItems, discoverItems]);

  const spotlight = useMemo<FeedItem | null>(() => {
    if (!isAuthenticated) return null;
    return feedItems[0] ?? null;
  }, [feedItems, isAuthenticated]);

  const featured = useMemo<FeedItem | null>(() => {
    if (activeTab !== "discover") return null;
    return discoverItems.find((i) => i.is_featured) ?? discoverItems[0] ?? null;
  }, [activeTab, discoverItems]);

  const handleSwitchToForYou = useCallback(() => {
    setActiveTab("for-you");
  }, []);

  const currentQuery = activeTab === "for-you" ? forYouQuery : discoverQuery;

  const feedStatus = useMemo<FeedStatus>(() => {
    if (activeTab === "for-you" && mounted && !isAuthenticated) {
      return { type: "login-gate" };
    }
    if (currentQuery.isLoading) {
      return { type: "loading" };
    }
    if (currentQuery.isError) {
      return { type: "error" };
    }
    if (feedItems.length === 0) {
      return { type: "empty" };
    }
    return { type: "ready", items: feedItems, featured };
  }, [
    activeTab,
    mounted,
    isAuthenticated,
    currentQuery.isLoading,
    currentQuery.isError,
    feedItems,
    featured,
  ]);

  return (
    <div className="space-y-6">
      {/* Hero — morphs between guest and auth, same structural slot */}
      {isAuthenticated ? (
        <AuthHero
          activeTab={activeTab}
          spotlight={spotlight}
          onSwitchToForYou={handleSwitchToForYou}
        />
      ) : (
        <GuestHero />
      )}

      {/* Sticky filter bar */}
      <StickyFilterBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contentType={contentType}
        setContentType={setContentType}
      />

      {/* Quick-links — guest only, shown below the filter bar */}
      {!isAuthenticated ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickLink
            href="/hubs"
            label="Community hubs"
            description="Join spaces around faith, writing, learning, stories, and creativity."
            icon={Users}
          />
          <QuickLink
            href="/education"
            label="Education"
            description="Explore curriculum resources, revision content, and teacher materials."
            icon={GraduationCap}
          />
          <QuickLink
            href="/writers"
            label="Writers"
            description="Find storytellers, teachers, poets, and faith voices to follow."
            icon={BookOpen}
          />
          <QuickLink
            href="/partnership"
            label="Partnership"
            description="Unlock partner-only content and support the creator ecosystem."
            icon={HeartHandshake}
          />
        </section>
      ) : null}

      {/* Feed body — all conditional logic inside FeedGrid */}
      <FeedGrid status={feedStatus} activeTab={activeTab} />
    </div>
  );
}
