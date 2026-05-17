"use client";

import Link from "next/link";

import RoleGuard from "@/components/auth/RoleGuard";
import { getStoredUser } from "@/lib/auth";

export default function WriterDashboardPage() {
    const user = getStoredUser();

    return (
        <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN"]}>
            <div className="space-y-8">
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                        Writer Studio
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                        Welcome, {user?.full_name ?? "Creator"}
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                        Create stories, poems, faith-based posts, educational resources, and
                        community content. All public content goes through review before
                        publishing.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/writer/publish"
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
                        >
                            Create new content
                        </Link>

                        <Link
                            href="/feed"
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
                        >
                            View public feed
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-sm text-white/45">Status</p>
                        <h2 className="mt-2 text-2xl font-semibold">Draft-first</h2>
                        <p className="mt-2 text-sm text-white/55">
                            Content starts as draft before review.
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-sm text-white/45">Review</p>
                        <h2 className="mt-2 text-2xl font-semibold">Moderated</h2>
                        <p className="mt-2 text-sm text-white/55">
                            Admins approve content before publishing.
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-sm text-white/45">Partnership</p>
                        <h2 className="mt-2 text-2xl font-semibold">Premium-ready</h2>
                        <p className="mt-2 text-sm text-white/55">
                            Mark content as partner-only when needed.
                        </p>
                    </div>
                </section>
            </div>
        </RoleGuard>
    );
}