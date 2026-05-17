"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";

import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { getStoredUser, saveAuthSession, getAccessToken } from "@/lib/auth";

export default function ProfilePage() {
    const queryClient = useQueryClient();

    const storedUser = getStoredUser();

    const [fullName, setFullName] = useState(storedUser?.full_name ?? "");
    const [username, setUsername] = useState(storedUser?.username ?? "");
    const [bio, setBio] = useState(storedUser?.bio ?? "");
    const [avatarUrl, setAvatarUrl] = useState(storedUser?.avatar_url ?? "");

    const { data, isLoading } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: api.me,
    });

    useEffect(() => {
        if (!data) return;

        setFullName(data.full_name);
        setUsername(data.username ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? "");
    }, [data]);

    const mutation = useMutation({
        mutationFn: api.updateMe,
        onSuccess: (updatedUser) => {
            const token = getAccessToken();

            if (token) {
                saveAuthSession({
                    access_token: token,
                    token_type: "bearer",
                    user: updatedUser,
                });
            }

            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        mutation.mutate({
            full_name: fullName,
            username: username || undefined,
            bio: bio || undefined,
            avatar_url: avatarUrl || undefined,
        });
    }

    const errorMessage =
        mutation.error instanceof ApiError
            ? mutation.error.detail
            : "Could not update profile.";

    if (isLoading) {
        return <LoadingState label="Loading profile..." />;
    }

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Profile
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Manage your public identity
                </h1>

                <p className="mt-4 text-sm leading-6 text-white/60">
                    This profile will appear on writer pages, comments, hubs, and learning
                    activity.
                </p>
            </section>

            <form
                onSubmit={handleSubmit}
                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
            >
                <div className="grid gap-5">
                    <div>
                        <label className="text-sm text-white/70">Full name</label>
                        <input
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm text-white/70">Username</label>
                        <input
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-white/70">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(event) => setBio(event.target.value)}
                            rows={5}
                            className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-white/30"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-white/70">Avatar URL</label>
                        <input
                            value={avatarUrl}
                            onChange={(event) => setAvatarUrl(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        />
                    </div>

                    {mutation.isError ? (
                        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {errorMessage}
                        </p>
                    ) : null}

                    {mutation.isSuccess ? (
                        <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            Profile updated.
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                    >
                        {mutation.isPending ? "Saving..." : "Save profile"}
                    </button>
                </div>
            </form>
        </div>
    );
}