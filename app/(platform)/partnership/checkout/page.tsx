"use client";

import { Suspense, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    CheckCircle2,
    HeartHandshake,
    Loader2,
    Phone,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { PartnershipPlan } from "@/lib/types";

// ─── Phone validation ─────────────────────────────────────────────────────────

const MPESA_REGEX = /^(07\d{8}|2547\d{8}|01\d{8}|2541\d{8})$/;

function normalizeMpesaNumber(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("07") || digits.startsWith("01")) {
        return "254" + digits.slice(1);
    }
    return digits;
}

function validatePhone(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Phone number is required.";
    if (!MPESA_REGEX.test(trimmed)) {
        return "Enter a valid Safaricom number, e.g. 0712345678 or 254712345678.";
    }
    return null;
}

// ─── Highlights (mirrors PartnershipPage) ────────────────────────────────────

const planHighlights: Record<PartnershipPlan, string[]> = {
    FREE: [],
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

// ─── Component ────────────────────────────────────────────────────────────────

function CheckoutPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planParam = searchParams.get("plan") as PartnershipPlan | null;

    // Guard: redirect unauthenticated visitors back to the plans page
    useEffect(() => {
        if (!getAccessToken()) {
            router.replace("/partnership");
        }
    }, [router]);

    // Guard: redirect if the plan param is missing or is FREE
    useEffect(() => {
        if (!planParam || planParam === "FREE") {
            router.replace("/partnership");
        }
    }, [planParam, router]);

    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    // Fetch full plan list to display the selected plan's details
    const plansQuery = useQuery({
        queryKey: ["partnerships", "plans"],
        queryFn: api.partnershipPlans,
    });

    const selectedPlan = plansQuery.data?.find((p) => p.plan === planParam);

    const startMutation = useMutation({
        mutationFn: (plan: PartnershipPlan) =>
            api.startPartnership({
                plan,
                phone_number: normalizeMpesaNumber(phoneNumber),
                referral_creator_id: null,
            }),
    });

    function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPhoneNumber(e.target.value);
        if (touched) {
            setPhoneError(validatePhone(e.target.value));
        }
    }

    function handlePhoneBlur() {
        setTouched(true);
        setPhoneError(validatePhone(phoneNumber));
    }

    function handleSubmit() {
        setTouched(true);
        const error = validatePhone(phoneNumber);
        setPhoneError(error);
        if (error || !planParam) return;
        startMutation.mutate(planParam);
    }

    const mutationErrorMessage =
        startMutation.error instanceof ApiError
            ? startMutation.error.detail
            : startMutation.isError
                ? "Payment request failed. Please try again."
                : null;

    // ── Loading state ────────────────────────────────────────────────────────

    if (plansQuery.isLoading) {
        return <LoadingState label="Loading plan details..." />;
    }

    // ── Success state ────────────────────────────────────────────────────────

    if (startMutation.isSuccess) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 pb-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-white">
                        STK push sent!
                    </h1>
                    <p className="mt-2 text-sm text-white/60">
                        Check your phone at{" "}
                        <span className="font-medium text-white">{phoneNumber}</span> and
                        enter your M-Pesa PIN to complete the payment.
                    </p>
                </div>
                <Link
                    href="/partnership"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to plans
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg space-y-6 pb-10">
            {/* Back link */}
            <Link
                href="/partnership"
                className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white/80"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to plans
            </Link>

            {/* Plan summary card */}
            {selectedPlan ? (
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                        You&rsquo;re activating
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                        <h1 className="text-2xl font-semibold text-white">
                            {selectedPlan.label}
                        </h1>
                        {selectedPlan.price_kes != null ? (
                            <div className="shrink-0 text-right">
                                <span className="text-xl font-bold text-white">
                                    KES {selectedPlan.price_kes.toLocaleString()}
                                </span>
                                <p className="mt-0.5 text-xs text-white/40">
                                    {selectedPlan.duration_days === 365
                                        ? "per year"
                                        : selectedPlan.duration_days === 30
                                            ? "per month"
                                            : `for ${selectedPlan.duration_days} days`}
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-white/60">
                        {selectedPlan.description}
                    </p>

                    {planHighlights[selectedPlan.plan].length > 0 ? (
                        <ul className="mt-5 space-y-3">
                            {planHighlights[selectedPlan.plan].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-3 text-sm text-white/65"
                                >
                                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </section>
            ) : null}

            {/* Payment form */}
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-sm font-semibold text-white">Pay with M-Pesa</h2>
                <p className="mt-1 text-xs text-white/45">
                    An STK push will be sent to the number below. Enter your M-Pesa PIN
                    to confirm.
                </p>

                <div className="mt-5">
                    <label
                        htmlFor="phone"
                        className="block text-sm text-white/70"
                    >
                        M-Pesa phone number
                    </label>
                    <div className="relative mt-2">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                        <input
                            id="phone"
                            type="tel"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            onBlur={handlePhoneBlur}
                            placeholder="0712 345 678 or 2547XXXXXXXX"
                            autoComplete="tel"
                            className={`w-full rounded-2xl border bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30 ${phoneError
                                ? "border-red-500/50 focus:border-red-400"
                                : "border-white/10"
                                }`}
                        />
                    </div>
                    {phoneError ? (
                        <p className="mt-2 text-xs text-red-300">{phoneError}</p>
                    ) : (
                        <p className="mt-2 text-xs text-white/40">
                            Safaricom numbers only (07XX, 01XX, or 2547XX).
                        </p>
                    )}
                </div>

                {/* API error */}
                {mutationErrorMessage ? (
                    <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {mutationErrorMessage}
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={startMutation.isPending || !!phoneError}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {startMutation.isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending request…
                        </>
                    ) : (
                        <>
                            <HeartHandshake className="h-4 w-4" />
                            Send M-Pesa request
                        </>
                    )}
                </button>

                <p className="mt-4 text-center text-xs text-white/30">
                    By continuing you agree to our{" "}
                    <Link
                        href="/terms"
                        className="underline underline-offset-2 hover:text-white/60"
                    >
                        terms of service
                    </Link>
                    .
                </p>
            </section>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<LoadingState label="Preparing checkout..." />}>
            <CheckoutPageContent />
        </Suspense>
    );
}