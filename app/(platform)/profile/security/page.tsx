"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useState } from "react";

import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";

export default function ProfileSecurityPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const meQuery = useQuery({
        queryKey: ["auth", "me"],
        queryFn: api.me,
    });

    const mutation = useMutation({
        mutationFn: api.changePassword,
        onSuccess: () => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        },
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            return;
        }

        mutation.mutate({
            current_password: currentPassword,
            new_password: newPassword,
        });
    }

    const passwordsDoNotMatch =
        confirmPassword.length > 0 && newPassword !== confirmPassword;

    const errorMessage =
        mutation.error instanceof ApiError
            ? mutation.error.detail
            : "Could not update password.";

    if (meQuery.isLoading) {
        return <LoadingState label="Loading security settings..." />;
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Account Security
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Password and account protection
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Keep your account secure. This affects access to publishing,
                    moderation, learning resources, and saved content.
                </p>

                <div className="mt-6">
                    <Link
                        href="/profile"
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10"
                    >
                        Back to profile
                    </Link>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <form
                    onSubmit={handleSubmit}
                    className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
                >
                    <h2 className="text-xl font-semibold">Change password</h2>

                    <div className="mt-5 grid gap-5">
                        <div>
                            <label className="text-sm text-white/70">Current password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm text-white/70">New password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                                minLength={8}
                                required
                            />
                            <p className="mt-2 text-xs text-white/35">
                                Use at least 8 characters. Later we can enforce stronger rules.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm text-white/70">Confirm new password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                                minLength={8}
                                required
                            />

                            {passwordsDoNotMatch ? (
                                <p className="mt-2 text-xs text-red-200">
                                    Passwords do not match.
                                </p>
                            ) : null}
                        </div>

                        {mutation.isError ? (
                            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {errorMessage}
                            </p>
                        ) : null}

                        {mutation.isSuccess ? (
                            <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                Password updated successfully.
                            </p>
                        ) : null}

                        <button
                            type="submit"
                            disabled={
                                mutation.isPending ||
                                passwordsDoNotMatch ||
                                !currentPassword ||
                                !newPassword ||
                                !confirmPassword
                            }
                            className="w-fit rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {mutation.isPending ? "Updating..." : "Update password"}
                        </button>
                    </div>
                </form>

                <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                        Account status
                    </p>

                    <div className="mt-5 space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-sm text-white/45">Role</p>
                            <p className="mt-2 text-lg font-semibold">
                                {meQuery.data?.role ?? "Unknown"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-sm text-white/45">Verification</p>
                            <p className="mt-2 text-lg font-semibold">
                                {meQuery.data?.is_verified ? "Verified" : "Not verified"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-sm text-white/45">Account</p>
                            <p className="mt-2 text-lg font-semibold">
                                {meQuery.data?.is_active ? "Active" : "Suspended"}
                            </p>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
}