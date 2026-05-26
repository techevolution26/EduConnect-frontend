"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, HeartHandshake, Lock, Sparkles } from "lucide-react";

import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type { PartnershipPlan } from "@/lib/types";

const planOrder: PartnershipPlan[] = [
  "FREE",
  "MONTHLY_PARTNER",
  "ANNUAL_PARTNER",
  "STUDENT_PARTNER",
  "TEACHER_PARTNER",
];

const planHighlights: Record<PartnershipPlan, string[]> = {
  FREE: [
    "Explore public content",
    "Join the reading community",
    "Limited-time starter access",
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

function planTone(plan: PartnershipPlan) {
  if (plan === "ANNUAL_PARTNER") {
    return "border-emerald-400/30 bg-emerald-400/10";
  }

  if (plan === "MONTHLY_PARTNER") {
    return "border-amber-400/30 bg-amber-400/10";
  }

  return "border-white/10 bg-white/[0.04]";
}

function planButtonLabel(plan: PartnershipPlan) {
  if (plan === "FREE") return "Start free access";
  if (plan === "MONTHLY_PARTNER") return "Start monthly partnership";
  if (plan === "ANNUAL_PARTNER") return "Start annual partnership";
  if (plan === "STUDENT_PARTNER") return "Start student partnership";
  return "Start teacher partnership";
}

export default function PartnershipPage() {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ["partnerships", "plans"],
    queryFn: api.partnershipPlans,
  });

  const myPartnershipQuery = useQuery({
    queryKey: ["partnerships", "me"],
    queryFn: api.myPartnership,
  });

  const startMutation = useMutation({
    mutationFn: (plan: PartnershipPlan) =>
      api.startPartnership({
        plan,
        referral_creator_id: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerships", "me"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: api.cancelPartnership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerships", "me"] });
    },
  });

  const plans = [...(plansQuery.data ?? [])].sort(
    (a, b) => planOrder.indexOf(a.plan) - planOrder.indexOf(b.plan),
  );

  const activePlan = myPartnershipQuery.data?.active_plan ?? null;
  const hasActivePartnership =
    myPartnershipQuery.data?.has_active_partnership ?? false;

  const errorMessage =
    startMutation.error instanceof ApiError
      ? startMutation.error.detail
      : cancelMutation.error instanceof ApiError
        ? cancelMutation.error.detail
        : "Partnership action failed.";

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">
              Partnership
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Support stories, education, and community.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
              Partnership unlocks premium content while helping writers,
              teachers, students, children’s learning, and African storytelling
              grow in one connected ecosystem.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5 lg:min-w-80">
            <div className="flex items-center gap-3">
              {hasActivePartnership ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              ) : (
                <Lock className="h-5 w-5 text-white/50" />
              )}

              <div>
                <p className="text-sm font-semibold">
                  {hasActivePartnership
                    ? "Active partnership"
                    : "No active partnership"}
                </p>

                <p className="mt-1 text-xs text-white/45">
                  {activePlan
                    ? activePlan
                    : "Start a plan to unlock partner-only content."}
                </p>
              </div>
            </div>

            {myPartnershipQuery.data?.expires_at ? (
              <p className="mt-4 text-xs text-white/45">
                Expires:{" "}
                {new Date(myPartnershipQuery.data.expires_at).toLocaleDateString()}
              </p>
            ) : null}

            {hasActivePartnership ? (
              <button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="mt-5 w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 disabled:opacity-60"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Cancel partnership"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {plansQuery.isLoading || myPartnershipQuery.isLoading ? (
        <LoadingState label="Loading partnership plans..." />
      ) : null}

      {plansQuery.isError || myPartnershipQuery.isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Could not load partnership information.
        </div>
      ) : null}

      {startMutation.isError || cancelMutation.isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {startMutation.isSuccess ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Partnership request started. Free plans activate immediately; paid
          plans remain pending until payment activation is connected.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isActive = activePlan === plan.plan && hasActivePartnership;
          const isPendingPaid = plan.plan !== "FREE";

          return (
            <article
              key={plan.plan}
              className={`rounded-[2rem] border p-5 ${planTone(plan.plan)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    {plan.plan}
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold">{plan.label}</h2>
                </div>

                {plan.plan === "ANNUAL_PARTNER" ? (
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-100">
                    Best value
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-white/65">
                {plan.description}
              </p>

              <p className="mt-3 text-xs text-white/45">
                Recommended for: {plan.recommended_for}
              </p>

              <ul className="mt-5 space-y-3">
                {planHighlights[plan.plan].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-white/65"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {isPendingPaid ? (
                <div className="mt-5 flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/50">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                  Paid plans currently create a pending partnership until a
                  payment provider is connected.
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => startMutation.mutate(plan.plan)}
                disabled={startMutation.isPending || isActive}
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isActive
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                <HeartHandshake className="h-4 w-4" />
                {isActive ? "Current plan" : planButtonLabel(plan.plan)}
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-semibold">How partnership unlocks content</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold">1. Start partnership</p>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Choose Free, Monthly, Annual, Student, or Teacher partnership.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold">2. Unlock access</p>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Active partners can read partner-only content and premium posts.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold">3. Support creators</p>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Partnership helps sustain writers, teachers, and community
              learning spaces.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}