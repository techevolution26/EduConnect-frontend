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
            <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
                <div className="kanga" />
                <div className="p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-accent-text">
                    Account Security
                </p>

                <h1 className="font-display mt-3 text-3xl tracking-tight text-fg">
                    Password and account protection
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                    Keep your account secure. This affects access to publishing,
                    moderation, learning resources, and saved content.
                </p>

                <div className="mt-6">
                    <Link
                        href="/profile"
                        className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim transition hover:bg-surface-2"
                    >
                        Back to profile
                    </Link>
                </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <form
                    onSubmit={handleSubmit}
                    className="rounded-[2rem] border border-border bg-surface p-6"
                >
                    <h2 className="font-display text-xl font-semibold">Change password</h2>

                    <div className="mt-5 grid gap-5">
                        <div>
                            <label className="text-sm text-fg-dim">Current password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm text-fg-dim">New password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                                minLength={8}
                                required
                            />
                            <p className="mt-2 text-xs text-fg-dim">
                                Use at least 8 characters. Later we can enforce stronger rules.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm text-fg-dim">Confirm new password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                                minLength={8}
                                required
                            />

                            {passwordsDoNotMatch ? (
                                <p className="mt-2 text-xs text-danger">
                                    Passwords do not match.
                                </p>
                            ) : null}
                        </div>

                        {mutation.isError ? (
                            <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                                {errorMessage}
                            </p>
                        ) : null}

                        {mutation.isSuccess ? (
                            <p className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
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
                            className="w-fit rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {mutation.isPending ? "Updating..." : "Update password"}
                        </button>
                    </div>
                </form>

                <aside className="h-fit rounded-[2rem] border border-border bg-surface p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
                        Account status
                    </p>

                    <div className="mt-5 space-y-4">
                        <div className="rounded-2xl border border-border bg-surface-2 p-4">
                            <p className="text-sm text-fg-dim">Role</p>
                            <p className="mt-2 text-lg font-semibold">
                                {meQuery.data?.role ?? "Unknown"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-surface-2 p-4">
                            <p className="text-sm text-fg-dim">Verification</p>
                            <p className="mt-2 text-lg font-semibold">
                                {meQuery.data?.is_verified ? "Verified" : "Not verified"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-surface-2 p-4">
                            <p className="text-sm text-fg-dim">Account</p>
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