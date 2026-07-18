"use client";

import {
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ThemeToggle from "@/components/theme/ThemeToggle";
import { useAuthSession } from "@/hooks/useAuthSession";

// ─── Static content ────────────────────────────────────────────────────────────

const pillars: Array<{
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    href: "/search?type=STORY",
    label: "Stories & poetry",
    description:
      "African-centred fiction, poetry, and personal essays from writers across the continent.",
    icon: BookOpen,
  },
  {
    href: "/search?type=FAITH",
    label: "Faith",
    description:
      "Devotionals and reflections for a community that reads together.",
    icon: Sparkles,
  },
  {
    href: "/education",
    label: "Education",
    description:
      "CBC and Cambridge-aligned revision material, schemes of work, and teaching notes.",
    icon: GraduationCap,
  },
  {
    href: "/children",
    label: "Children's space",
    description:
      "Age-grouped, moderated stories and learning content built for young readers.",
    icon: ShieldCheck,
  },
  {
    href: "/hubs",
    label: "Hubs",
    description:
      "Communities built around shared interests — writing, faith, learning, and more.",
    icon: Users,
  },
  {
    href: "/partnership",
    label: "Partnership",
    description:
      "Support writers directly and unlock premium content — pay easily with M-Pesa.",
    icon: HeartHandshake,
  },
];

const trustPoints = [
  {
    title: "Moderated before it's public",
    description:
      "Every submission goes through a review queue before it reaches readers — nothing is published unchecked.",
  },
  {
    title: "Built for young readers too",
    description:
      "Children's content is age-grouped and curated separately, with its own review step.",
  },
  {
    title: "Works on a slow connection",
    description:
      "Built lean for everyday mobile data, not just fast home wifi.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuthSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Existing sessions skip the marketing page and land straight in the feed.
  // Guests see this page immediately — there's no gate on first paint.
  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/feed");
    }
  }, [isReady, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-ink text-fg">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="font-display text-lg text-fg">
            GateWays
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-fg-dim md:flex">
            <Link href="/hubs" className="transition hover:text-fg">
              Hubs
            </Link>
            <Link href="/education" className="transition hover:text-fg">
              Education
            </Link>
            <Link href="/partnership" className="transition hover:text-fg">
              Partnership
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim transition hover:bg-surface-2"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:opacity-90"
            >
              Join
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface text-fg-dim md:hidden"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {mobileNavOpen ? (
          <div className="border-t border-border px-5 py-4 md:hidden">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="text-sm text-fg-dim">Appearance</p>
              <ThemeToggle />
            </div>

            <div className="space-y-2">
              <Link
                href="/hubs"
                onClick={() => setMobileNavOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
              >
                Hubs
              </Link>
              <Link
                href="/education"
                onClick={() => setMobileNavOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
              >
                Education
              </Link>
              <Link
                href="/partnership"
                onClick={() => setMobileNavOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
              >
                Partnership
              </Link>
            </div>

            <div className="mt-4 grid gap-2">
              <Link
                href="/login"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-center text-sm text-fg transition hover:bg-surface-2"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-2xl bg-accent px-4 py-3 text-center text-sm font-semibold text-on-accent"
              >
                Join
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-5 py-12 sm:px-8 sm:py-16">
        {/* Hero */}
        <section className="overflow-hidden rounded-[2rem] border border-border bg-surface">
          <div className="kanga" />
          <div className="p-6 sm:p-10 lg:p-14">
            <p className="text-xs uppercase tracking-[0.28em] text-accent-text">
              Reading &amp; community ecosystem
            </p>

            <h1 className="font-display mt-4 max-w-3xl text-4xl tracking-tight text-fg sm:text-5xl lg:text-6xl">
              Stories, lessons, and faith — carried by the people who write
              them.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-fg-dim sm:text-base">
              A publishing and community home for African-centred storytelling,
              CBC and Cambridge learning resources, moderated children&rsquo;s
              reading, and creator-led publishing — built for Kenya and beyond.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
              >
                Join the community
              </Link>
              <Link
                href="/feed"
                className="rounded-2xl border border-border bg-surface-2 px-5 py-3 text-sm text-fg-dim transition hover:text-fg"
              >
                Browse without an account
              </Link>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section>
          <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
            What&rsquo;s here
          </p>
          <h2 className="font-display mt-2 text-2xl text-fg sm:text-3xl">
            One ecosystem, six kinds of reading
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Link
                  key={pillar.href}
                  href={pillar.href}
                  className="group rounded-[1.5rem] border border-border bg-surface p-5 transition hover:border-accent/40 hover:bg-accent/[0.06]"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-border bg-surface-2 p-3 text-fg-dim transition group-hover:text-fg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg text-fg">
                        {pillar.label}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-fg-dim">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Trust / safety */}
        <section className="rounded-[2rem] border border-border bg-surface-2 p-6 sm:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
            Built with care
          </p>
          <h2 className="font-display mt-2 text-2xl text-fg sm:text-3xl">
            Safety and moderation aren&rsquo;t an afterthought
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <h3 className="font-display text-base text-fg">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-fg-dim">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Partnership teaser */}
        <section className="grid gap-6 rounded-[2rem] border border-accent/30 bg-accent-soft p-6 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-accent-text">
              Partnership
            </p>
            <h2 className="font-display mt-2 text-2xl text-fg sm:text-3xl">
              Support the ecosystem, unlock premium content
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-fg-dim">
              Partnership plans help pay writers and teachers directly. Activate
              one in a minute with M-Pesa — no card required.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/partnership"
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
            >
              See partnership plans
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <h2 className="font-display text-2xl text-fg sm:text-3xl">
            Ready to start reading?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-fg-dim">
            Create a free account to follow writers, join hubs, and build your
            own personalised feed.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
            >
              Create your account
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-border bg-surface px-5 py-3 text-sm text-fg-dim transition hover:bg-surface-2"
            >
              Login
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-fg-dim sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} GateWays</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/hubs" className="transition hover:text-fg">
              Hubs
            </Link>
            <Link href="/education" className="transition hover:text-fg">
              Education
            </Link>
            <Link href="/partnership" className="transition hover:text-fg">
              Partnership
            </Link>
            <Link href="/login" className="transition hover:text-fg">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
