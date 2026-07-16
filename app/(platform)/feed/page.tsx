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
import { useEffect, useMemo, useState } from "react";

import ContentCard from "@/components/content/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ContentType } from "@/lib/types";

type FeedTab = "discover" | "for-you";

const contentTypeFilters: Array<{ label: string; value: ContentType | "" }> = [
  { label: "All", value: "" },
  { label: "Stories", value: "STORY" },
  { label: "Poetry", value: "POEM" },
  { label: "Faith", value: "FAITH" },
  { label: "Education", value: "EDUCATION" },
  { label: "Children", value: "CHILDREN" },
  { label: "Tech", value: "ARTICLE" },
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
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="rounded-[2rem] border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-surface-2"
    >
      <Icon className="h-5 w-5 text-fg-dim" />
      <h3 className="mt-4 font-display text-lg text-fg">{label}</h3>
      <p className="mt-2 text-sm leading-6 text-fg-dim">{description}</p>
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
    <div className="rounded-[1.75rem] border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-fg-dim">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-fg">{value}</p>
      <p className="mt-2 text-sm leading-6 text-fg-dim">{helper}</p>
    </div>
  );
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
    enabled: mounted && activeTab === "for-you" && isAuthenticated,
  });

  const currentQuery = activeTab === "discover" ? discoverQuery : forYouQuery;
  const items = currentQuery.data?.items ?? [];

  const featured = useMemo(() => {
    if (activeTab !== "discover") return null;
    return items.find((item) => item.is_featured) ?? items[0] ?? null;
  }, [activeTab, items]);

  const rest = useMemo(() => {
    if (activeTab !== "discover") return items;
    return items.filter((item) => item.id !== featured?.id);
  }, [activeTab, items, featured]);

  function selectForYou() {
    setActiveTab("for-you");
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-surface">
        <div className="kanga" />

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">
              Reading ecosystem
            </p>

            <h1 className="mt-3 max-w-4xl font-display text-4xl tracking-tight text-fg sm:text-5xl lg:text-6xl">
              Discover stories, lessons, faith, and community voices.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-dim sm:text-base">
              A public window into African-centered storytelling, education,
              children-safe learning, faith content, and creator-led publishing.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {!mounted || !isAuthenticated ? (
                <>
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
                </>
              ) : (
                <Link
                  href="/writer/dashboard"
                  className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
                >
                  Go to workspace
                </Link>
              )}

              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg-dim transition hover:text-fg"
              >
                <Search className="h-4 w-4" />
                Search ecosystem
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-surface-2 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="font-semibold text-fg">What you can explore</h2>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-fg-dim">
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
      </section>

      <section className="flex flex-col gap-4 rounded-[2rem] border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("discover")}
            className={`rounded-2xl px-4 py-2 text-sm transition ${activeTab === "discover"
              ? "bg-accent text-on-accent"
              : "border border-border bg-surface-2 text-fg-dim hover:text-fg"
              }`}
          >
            Discover
          </button>

          <button
            type="button"
            onClick={selectForYou}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition ${activeTab === "for-you"
              ? "bg-accent text-on-accent"
              : "border border-border bg-surface-2 text-fg-dim hover:text-fg"
              }`}
          >
            {!mounted || !isAuthenticated ? (
              <Lock className="h-3.5 w-3.5" />
            ) : null}
            For you
          </button>
        </div>

        {activeTab === "discover" ? (
          <div className="flex gap-2 overflow-x-auto pb-1 md:max-w-[60%]">
            {contentTypeFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => setContentType(filter.value)}
                className={`shrink-0 rounded-2xl px-4 py-2 text-sm transition ${contentType === filter.value
                  ? "bg-accent text-on-accent"
                  : "border border-border bg-surface-2 text-fg-dim hover:text-fg"
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {activeTab === "for-you" && !mounted ? null : null}

      {activeTab === "for-you" && mounted && !isAuthenticated ? (
        <section className="rounded-[2rem] border border-accent/30 bg-accent-soft p-6">
          <h2 className="text-xl font-semibold text-accent">
            Login to unlock your personalized feed
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-dim">
            Your For You feed is based on followed writers, joined hubs,
            reading behavior, interests, and your role.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim transition hover:bg-surface-2"
            >
              Create account
            </Link>
          </div>
        </section>
      ) : null}

      {activeTab === "discover" ? (
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

      {currentQuery.isLoading && activeTab !== "for-you" ? (
        <LoadingState label="Loading feed..." />
      ) : null}

      {currentQuery.isLoading && activeTab === "for-you" && isAuthenticated ? (
        <LoadingState label="Loading your personalized feed..." />
      ) : null}

      {currentQuery.isError && activeTab !== "for-you" ? (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          Something went wrong while loading the feed. Please refresh the page or try again later.
        </div>
      ) : null}

      {activeTab === "discover" && featured ? (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="overflow-hidden rounded-[2rem] border border-border bg-surface">
            <div className="kanga" />

            <div className="p-6 md:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-accent">
                Featured story
              </div>

              <h2 className="mt-6 max-w-3xl font-display text-3xl leading-tight tracking-tight text-fg sm:text-4xl lg:text-5xl">
                {featured.title}
              </h2>

              {featured.excerpt ? (
                <p className="mt-5 max-w-2xl text-sm leading-7 text-fg-dim sm:text-base">
                  {featured.excerpt}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/read/${featured.slug}`}
                  className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
                >
                  Read featured story
                </Link>

                <Link
                  href="/writers"
                  className="rounded-2xl border border-border bg-surface-2 px-5 py-3 text-sm text-fg-dim transition hover:text-fg"
                >
                  Explore writers
                </Link>

                {featured.is_premium ? (
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {rest.slice(0, 2).map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        </section>
      ) : null}

      {!currentQuery.isLoading &&
        !currentQuery.isError &&
        activeTab === "discover" &&
        rest.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
              Latest
            </p>
            <h2 className="mt-2 font-display text-2xl text-fg">
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
        items.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </section>
      ) : null}

      {!currentQuery.isLoading &&
        !currentQuery.isError &&
        activeTab === "discover" &&
        items.length === 0 ? (
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
        items.length === 0 ? (
        <EmptyState
          title="Your personalized feed is empty"
          description="Follow writers or join hubs to personalize this feed."
        />
      ) : null}
    </div>
  );
}