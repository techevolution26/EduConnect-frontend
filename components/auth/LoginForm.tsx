"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";

export default function LoginForm() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const mutation = useMutation({
        mutationFn: api.login,
        onSuccess: (session) => {
            saveAuthSession(session);
            queryClient.setQueryData(["auth", "me"], session.user);
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            router.push("/feed");
        },
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        mutation.mutate({
            email,
            password,
        });
    }

    const errorMessage =
        mutation.error instanceof ApiError
            ? mutation.error.detail
            : "Login failed.";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="text-sm text-fg-dim">Email</label>
                <input
                    className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />
            </div>

            <div>
                <label className="text-sm text-fg-dim">Password</label>
                <input
                    className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
            </div>

            {mutation.isError ? (
                <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                    {errorMessage}
                </p>
            ) : null}

            <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {mutation.isPending ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
}