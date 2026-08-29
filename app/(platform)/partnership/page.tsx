"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, GraduationCap, HeartHandshake, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { clearAuthSession, getAccessToken, getStoredUser } from "@/lib/auth";
import { isEligibleForPlan } from "@/lib/roles";
import type { PartnershipPlan } from "@/lib/types";

// ─── Static plan metadata ────────────────────────────────────────────────────

const planOrder: PartnershipPlan[] = [
  "FREE",
  "MONTHLY_PARTNER",
  "ANNUAL_PARTNER",
  "STUDENT_PARTNER",
  "TEACHER_PARTNER",
];

const planHighlights: Record<PartnershipPlan, string[]> = {
  FREE: [
    "Read public content",
    "Join the reading community",
    "Browse without payment",
  ],
  MONTHLY_PARTNER: [
    "Unlock partner-only content",
    "Support writers monthly",
    "Access premium learning content",
  ],
  ANNUAL_PARTNER: [
    "Best long-term value",
    "Support the ecosystem yearly",
    "Unlock premium stories and resources",
  ],
  STUDENT_PARTNER: [
    "Discounted learning access",
    "Education-first resources",
    "Designed for students",
  ],
  TEACHER_PARTNER: [
    "Teacher-friendly access",
    "Learning and publishing support",
    "Useful for classroom resources",
  ],
};

function planCardStyle(plan: PartnershipPlan) {
  if (plan === "ANNUAL_PARTNER") return "border-success/30 bg-success-soft";
  if (plan === "MONTHLY_PARTNER") return "border-accent/30 bg-accent-soft";
  return "border-border bg-surface";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PartnershipPage() {
  const [mounted, setMounted] = useState(false);
  const [hasSessionToken, setHasSessionToken] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => (typeof window !== "undefined" ? getStoredUser() : null));

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMounted(true);
      setHasSessionToken(Boolean(getAccessToken()));
      setCurrentUser(getStoredUser());
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const isAuthenticated = mounted && hasSessionToken;

  const plansQuery = useQuery({
    queryKey: ["partnerships", "plans"],
    queryFn: api.partnershipPlans,
  });

  const myPartnershipQuery = useQuery({
    queryKey: ["partnerships", "me"],
    queryFn: api.myPartnership,
    enabled: isAuthenticated,
    retry: false,
  });

  // Clear stale session on 401
  useEffect(() => {
    if (!myPartnershipQuery.error) return;
    const timeout = window.setTimeout(() => {
      if (
        myPartnershipQuery.error instanceof ApiError &&
        myPartnershipQuery.error.status === 401
      ) {
        clearAuthSession();
        setHasSessionToken(false);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [myPartnershipQuery.error]);

  const plans = [...(plansQuery.data ?? [])].sort(
    (a, b) => planOrder.indexOf(a.plan) - planOrder.indexOf(b.plan),
  );

  const activePlan = myPartnershipQuery.data?.active_plan ?? null;
  const hasActivePartnership =
    myPartnershipQuery.data?.has_active_partnership ?? false;
  const hasPaidPartnership = hasActivePartnership && activePlan !== "FREE";
  const hasPublicAccess = activePlan === "FREE";

  // ── Hero status copy ────────────────────────────────────────────────────

  const heroStatusLabel = hasPaidPartnership
    ? "Active partnership"
    : hasPublicAccess
      ? "Public access"
      : isAuthenticated
        ? "No active partnership"
        : "Guest access";

  const heroStatusDetail = hasPaidPartnership
    ? (activePlan ?? "Your plan is active.")
    : hasPublicAccess
      ? "You can browse public content. Choose a paid plan to unlock partner-only content."
      : isAuthenticated
        ? "Choose a paid plan to unlock partner-only content and support creators."
        : "Browse plans now, then sign in to activate one.";

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
        <div className="kanga" />
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent-text">
              Partnership
            </p>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Support stories, education, and community.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
              Partnership unlocks premium content while helping writers,
              teachers, students, children&rsquo;s learning, and African
              storytelling grow in one connected ecosystem.
            </p>
          </div>

          <div className="rounded-[2rem] border border-border bg-surface-2 p-5">
            <div className="flex items-center gap-3">
              {hasPaidPartnership ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Lock className="h-5 w-5 text-fg-dim" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">
                  {heroStatusLabel}
                </p>
                <p className="mt-1 text-xs text-fg-dim">{heroStatusDetail}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loading */}
      {plansQuery.isLoading ||
      (isAuthenticated && myPartnershipQuery.isLoading) ? (
        <LoadingState label="Loading partnership plans..." />
      ) : null}

      {/* Plan cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isPaidPlan = plan.plan !== "FREE";
          const isCurrentPlan =
            activePlan === plan.plan && hasActivePartnership;
          const isPublicAccessPlan = plan.plan === "FREE";
          const isEligible = isEligibleForPlan(currentUser, plan.plan);
          const isRoleRestricted = plan.plan === "STUDENT_PARTNER" || plan.plan === "TEACHER_PARTNER";

          return (
            <article
              key={plan.plan}
              className={`rounded-[2rem] border p-5 ${planCardStyle(plan.plan)}`}
            >
              {/* Plan name + price */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-fg-dim">
                    {plan.plan}
                  </p>
                  <h2 className="font-display mt-3 text-2xl font-semibold text-fg">
                    {plan.label}
                  </h2>
                </div>

                {/* Price badge — rendered from API data */}
                {isPaidPlan && plan.price_kes != null ? (
                  <div className="shrink-0 text-right">
                    <span className="text-xl font-bold text-fg">
                      KES {plan.price_kes.toLocaleString()}
                    </span>
                    <p className="mt-0.5 text-xs text-fg-dim">
                      {plan.duration_days === 365
                        ? "per year"
                        : plan.duration_days === 30
                          ? "per month"
                          : `for ${plan.duration_days} days`}
                    </p>
                  </div>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-fg-dim">
                {plan.description}
              </p>

              {/* Highlights */}
              <ul className="mt-5 space-y-3">
                {planHighlights[plan.plan].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-fg-dim"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-fg-dim" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-6">
                {isPublicAccessPlan ? (
                  /* FREE — no action needed */
                  <button
                    type="button"
                    disabled
                    title="No payment required for public access"
                    className="inline-flex w-full cursor-default items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-fg-dim"
                  >
                    <HeartHandshake className="h-4 w-4" />
                    Public access
                  </button>
                ) : isCurrentPlan ? (
                  /* Already on this plan */
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Current plan
                  </div>
                ) : isAuthenticated && isRoleRestricted && !isEligible ? (
                  /* Authenticated but ineligible (e.g. a reader viewing
                     STUDENT_PARTNER) -- show why instead of a dead-end
                     checkout that the backend will reject with a 403. */
                  <div
                    title={`This plan requires the ${
                      plan.plan === "STUDENT_PARTNER" ? "Student" : "Teacher"
                    } role on your account`}
                    className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-fg-dim"
                  >
                    <GraduationCap className="h-4 w-4" />
                    {plan.plan === "STUDENT_PARTNER" ? "Students only" : "Teachers only"}
                  </div>
                ) : isAuthenticated ? (
                  /* Authenticated — go to checkout page for this plan */
                  <Link
                    href={`/partnership/checkout?plan=${plan.plan}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
                  >
                    <HeartHandshake className="h-4 w-4" />
                    Pay with M-Pesa
                  </Link>
                ) : (
                  /* Guest — prompt to log in first */
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90"
                  >
                    <HeartHandshake className="h-4 w-4" />
                    Login to start
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
