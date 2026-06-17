"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Lock,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";

import ContentCard from "@/components/content/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { Content, ContentType } from "@/lib/types";

type FeedTab = "discover" | "for-you";

type FeedItem = Content;

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
];

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
      className="group rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06] hover:border-white/20"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white/80 transition group-hover:bg-white/10 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">{label}</h3>
          <p className="mt-1 text-sm leading-6 text-white/55">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function PinnedStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/45">{helper}</p>
    </div>
  );
}

function getCoverImageUrl(item: unknown) {
  if (!item || typeof item !== "object") return null;

  const value = item as {
    cover_image_url?: string | null;
    cover_image?: string | null;
    cover_image_src?: string | null;
  };

  return value.cover_image_url ?? value.cover_image ?? value.cover_image_src ?? null;
}

function getCoverTone(item: unknown) {
  if (!item || typeof item !== "object") return "#0f1117";

  const value = item as {
    cover_color?: string | null;
    accent_color?: string | null;
    hero_color?: string | null;
  };

  return value.cover_color ?? value.accent_color ?? value.hero_color ?? "#0f1117";
}

function FeedTabs({
  activeTab,
  setActiveTab,
  contentType,
  setContentType,
  isAuthenticated,
}: {
  activeTab: FeedTab;
  setActiveTab: (tab: FeedTab) => void;
  contentType: ContentType | "";
  setContentType: (type: ContentType | "") => void;
  isAuthenticated: boolean;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("discover")}
          className={`rounded-2xl px-4 py-2 text-sm transition ${activeTab === "discover"
            ? "bg-white text-black"
            : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
        >
          Discover
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("for-you")}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition ${activeTab === "for-you"
            ? "bg-white text-black"
            : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
        >
          {!isAuthenticated ? <Lock className="h-3.5 w-3.5" /> : null}
          For you
        </button>
      </div>

      {activeTab === "discover" ? (
        <div className="flex gap-2 overflow-x-auto pb-1 md:max-w-[60%]">
          {contentTypeFilters.map((filter) => {
            const active = contentType === filter.value;

            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => setContentType(filter.value)}
                className={`shrink-0 rounded-2xl px-4 py-2 text-sm transition ${active
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function GuestHero() {
  return (
    <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-white/40">
          Reading ecosystem
        </p>

        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Discover stories, lessons, faith, and community voices.
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
          A public window into African-centered storytelling, education,
          children-safe learning, faith content, and creator-led publishing.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-white/90"
          >
            Join the community
          </Link>

          <Link
            href="/login"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10"
          >
            Login
          </Link>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10"
          >
            <Search className="h-4 w-4" />
            Search ecosystem
          </Link>
        </div>
      </div>

      <div className="relative rounded-[2rem] border border-white/10 bg-black/25 p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-200/80" />
          <h2 className="font-semibold text-white">What you can explore</h2>
        </div>

        <div className="mt-4 grid gap-3 text-sm text-white/60">
          <p>• Public stories, poems, faith posts, and lessons</p>
          <p>• Hubs for shared interests and community discovery</p>
          <p>• Partner-only content previews before joining</p>
          <p>• Personalized feed after login</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <PinnedStat
            label="Public"
            value="Open"
            helper="Discovery feed is public"
          />
          <PinnedStat
            label="Premium"
            value="Partner"
            helper="Supports creator earnings"
          />
          <PinnedStat
            label="Safety"
            value="Curated"
            helper="Moderated and structured"
          />
        </div>
      </div>
    </div>
  );
}

function AuthHero({
  activeTab,
  spotlight,
  spotlightTone,
}: {
  activeTab: FeedTab;
  spotlight: FeedItem | null;
  spotlightTone: string;
}) {
  const spotlightCoverUrl = getCoverImageUrl(spotlight);

  return (
    <section className="space-y-4">
      <article className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-8 lg:p-10">
        <div
          className="absolute inset-0"
          style={
            spotlightCoverUrl
              ? {
                backgroundImage: `linear-gradient(135deg, rgba(2,6,23,0.40), rgba(2,6,23,0.78)), url(${spotlightCoverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
              : {
                backgroundImage: `linear-gradient(135deg, ${spotlightTone}, #111827 55%, #020617)`,
              }
          }
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_28%),radial-gradient(circle_at_center,rgba(14,165,233,0.10),transparent_34%)]" />

        <div className="relative flex min-h-[36vh] flex-col justify-end lg:min-h-[48vh]">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            {activeTab === "for-you" ? "Your feed" : "Featured content"}
          </div>

          <h1 className="mt-4 max-w-5xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-6xl">
            {spotlight ? spotlight.title : "Your content feed is ready"}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
            {spotlight?.excerpt ||
              "Fresh content from the ecosystem, shaped around what you follow, read, and join."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {spotlight ? (
              <Link
                href={`/read/${spotlight.slug}`}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-white/90"
              >
                Open featured content
              </Link>
            ) : null}

            {activeTab !== "for-you" ? (
              <button
                type="button"
                onClick={() => {
                  // parent handles this in a real action
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10"
              >
                See For you
              </button>
            ) : null}

            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
              Search ecosystem
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}

function FeedLoading({ activeTab, isAuthenticated }: { activeTab: FeedTab; isAuthenticated: boolean; }) {
  if (activeTab === "for-you" && isAuthenticated) {
    return <LoadingState label="Loading your personalized feed..." />;
  }

  return <LoadingState label="Loading feed..." />;
}

export default function FeedPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>("discover");
  const [contentType, setContentType] = useState<ContentType | "">("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const token = mounted ? getAccessToken() : null;
  const isAuthenticated = Boolean(token);

  const discoverQuery = useQuery({
    queryKey: ["feed", "discover", contentType],
    queryFn: () =>
      api.discoverFeed({
        limit: 30,
        content_type: contentType || undefined,
      }),
  });

  const forYouQuery = useQuery({
    queryKey: ["feed", "for-you"],
    queryFn: () => api.forYouFeed(),
    enabled: mounted && isAuthenticated && activeTab === "for-you",
  });

  const discoverItems: FeedItem[] = discoverQuery.data?.items ?? [];
  const forYouItems: FeedItem[] = forYouQuery.data?.items ?? [];
  const currentQuery = activeTab === "for-you" ? forYouQuery : discoverQuery;

  const currentItems = activeTab === "for-you" ? forYouItems : discoverItems;

  const featured = useMemo(() => {
    if (activeTab !== "discover") return null;
    return discoverItems.find((item) => item.is_featured) ?? discoverItems[0] ?? null;
  }, [activeTab, discoverItems]);

  const spotlight = useMemo(() => {
    if (!isAuthenticated) return null;

    if (activeTab === "for-you") {
      return forYouItems[0] ?? discoverItems[0] ?? null;
    }

    return featured ?? discoverItems[0] ?? null;
  }, [activeTab, discoverItems, featured, forYouItems, isAuthenticated]);

  const spotlightTone = getCoverTone(spotlight);

  const rest =
    activeTab === "discover" && featured
      ? discoverItems.filter((item) => item.id !== featured.id)
      : [];

  const authenticatedFallbackList = useMemo(() => {
    if (!isAuthenticated) return [];
    const source = activeTab === "for-you" ? forYouItems : discoverItems;
    return source.filter((item) => item.id !== spotlight?.id).slice(0, 4);
  }, [activeTab, discoverItems, forYouItems, isAuthenticated, spotlight?.id]);

  const showLoginGate = activeTab === "for-you" && mounted && !isAuthenticated;

  return (
    <div className="space-y-6">
      {!isAuthenticated ? (
        <GuestHero />
      ) : (
        <AuthHero
          activeTab={activeTab}
          spotlight={spotlight}
          spotlightTone={spotlightTone}
        />
      )}

      <FeedTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contentType={contentType}
        setContentType={setContentType}
        isAuthenticated={isAuthenticated}
      />

      {showLoginGate ? (
        <section className="rounded-[2rem] border border-amber-500/30 bg-amber-500/10 p-6">
          <h2 className="text-xl font-semibold text-amber-100">
            Login to unlock your personalized feed
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-100/75">
            Your For You feed is based on followed writers, joined hubs,
            reading behavior, interests, and your role.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
            >
              Create account
            </Link>
          </div>
        </section>
      ) : null}

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

      {discoverQuery.isLoading || (forYouQuery.isLoading && activeTab === "for-you") ? (
        <FeedLoading activeTab={activeTab} isAuthenticated={isAuthenticated} />
      ) : null}

      {discoverQuery.isError && activeTab === "discover" ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Something went wrong while loading the feed. Please refresh the page or
          try again later.
        </div>
      ) : null}

      {activeTab === "discover" && featured ? (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-orange-500/15 via-fuchsia-500/10 to-cyan-500/10 p-[1px] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,115,0,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_32%)]" />
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f1117]/95 p-6 md:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-amber-200">
                Featured story
              </div>

              <h2 className="mt-6 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {featured.title}
              </h2>

              {featured.excerpt ? (
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                  {featured.excerpt}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/read/${featured.slug}`}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-white/90"
                >
                  Read featured story
                </Link>

                <Link
                  href="/writers"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Explore writers
                </Link>

                {featured.is_premium ? (
                  <Link
                    href="/partnership"
                    className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-100 transition hover:bg-amber-500/15"
                  >
                    Partner content
                  </Link>
                ) : null}
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {currentItems
              .filter((content) => content.id !== featured.id)
              .slice(0, 2)
              .map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
          </div>
        </section>
      ) : null}

      {!discoverQuery.isLoading &&
        !discoverQuery.isError &&
        activeTab === "discover" &&
        rest.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">
              Latest
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Fresh from the ecosystem
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        </section>
      ) : null}

      {!currentQuery.isLoading &&
        !currentQuery.isError &&
        activeTab === "for-you" &&
        mounted &&
        isAuthenticated &&
        currentItems.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {currentItems.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </section>
      ) : null}

      {!currentQuery.isLoading &&
        !currentQuery.isError &&
        activeTab === "discover" &&
        currentItems.length === 0 ? (
        <EmptyState
          title="No public content yet"
          description="Published content will appear here once approved. Explore hubs, writers, and education sections meanwhile."
        />
      ) : null}

      {!currentQuery.isLoading &&
        !currentQuery.isError &&
        activeTab === "for-you" &&
        mounted &&
        isAuthenticated &&
        currentItems.length === 0 ? (
        <EmptyState
          title="Your personalized feed is empty"
          description="Follow writers or join hubs to personalize this feed."
        />
      ) : null}

      {authenticatedFallbackList.length > 0 && activeTab === "for-you" ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">
              More to explore
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Suggested content
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {authenticatedFallbackList.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}