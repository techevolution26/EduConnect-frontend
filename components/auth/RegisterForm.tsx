"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";

export default function RegisterForm() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const mutation = useMutation({
        mutationFn: api.register,
        onSuccess: (session) => {
            saveAuthSession(session);
            router.push("/feed");
        },
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        mutation.mutate({
            full_name: fullName,
            username: username || undefined,
            email,
            password,
        });
    }

    const errorMessage =
        mutation.error instanceof ApiError
            ? mutation.error.detail
            : "Registration failed.";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="text-sm text-fg-dim">Full name</label>
                <input
                    className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                />
            </div>

            <div>
                <label className="text-sm text-fg-dim">Username</label>
                <input
                    className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-fg-dim/70 focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
            </div>

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
                {mutation.isPending ? "Creating account..." : "Create account"}
            </button>
        </form>
    );
}