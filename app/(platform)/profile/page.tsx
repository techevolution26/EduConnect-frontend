"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BookOpen,
    GraduationCap,
    Library,
    PenLine,
    ShieldCheck,
    UserCircle,
    Users,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { getAccessToken, saveAuthSession } from "@/lib/auth";
import type { User, UserRole } from "@/lib/types";

function getRoleDescription(role: UserRole) {
    const descriptions: Record<UserRole, string> = {
        READER:
            "You can read content, follow writers, join hubs, save posts, and participate in discussions.",
        WRITER:
            "You can publish content, manage drafts, submit posts for review, and build a reader audience.",
        TEACHER:
            "You can publish learning content and attach education metadata for curriculum-based resources.",
        STUDENT:
            "You can access learning materials, save resources, follow writers, and participate in community learning.",
        PARENT:
            "You can access children’s learning spaces, education resources, and family-friendly content.",
        MODERATOR:
            "You can review submitted content, approve safe posts, reject unsafe content, and help protect the community.",
        ADMIN:
            "You have full platform management access including users, roles, content review, hubs, categories, and analytics.",
        SUPER_ADMIN:
            "You have unrestricted platform access, including granting scoped permissions to other admins, managing referral payouts, and every capability an admin can hold.",
    };

    return descriptions[role];
}

function getRoleActions(role: UserRole) {
    const common = [
        {
            href: "/feed",
            label: "Explore feed",
            icon: BookOpen,
        },
        {
            href: "/library",
            label: "Saved library",
            icon: Library,
        },
        {
            href: "/hubs",
            label: "Community hubs",
            icon: Users,
        },
    ];

    const roleSpecific: Record<UserRole, typeof common> = {
        READER: [
            {
                href: "/partnership",
                label: "Partnership",
                icon: Library,
            },
        ],
        WRITER: [
            {
                href: "/writer/dashboard",
                label: "Writer Studio",
                icon: PenLine,
            },
        ],
        TEACHER: [
            {
                href: "/writer/dashboard",
                label: "Teacher Studio",
                icon: PenLine,
            },
            {
                href: "/education",
                label: "Education resources",
                icon: GraduationCap,
            },
        ],
        STUDENT: [
            {
                href: "/education",
                label: "Learning resources",
                icon: GraduationCap,
            },
        ],
        PARENT: [
            {
                href: "/children",
                label: "Children’s space",
                icon: ShieldCheck,
            },
            {
                href: "/education",
                label: "Education resources",
                icon: GraduationCap,
            },
        ],
        MODERATOR: [
            {
                href: "/admin/review",
                label: "Review queue",
                icon: ShieldCheck,
            },
        ],
        ADMIN: [
            {
                href: "/admin/dashboard",
                label: "Admin dashboard",
                icon: ShieldCheck,
            },
            {
                href: "/admin/content",
                label: "Manage content",
                icon: PenLine,
            },
        ],
        SUPER_ADMIN: [
            {
                href: "/admin/dashboard",
                label: "Admin dashboard",
                icon: ShieldCheck,
            },
            {
                href: "/admin/permissions",
                label: "Admin permissions",
                icon: ShieldCheck,
            },
            {
                href: "/admin/payouts",
                label: "Referral payouts",
                icon: Library,
            },
        ],
    };

    return [...common, ...roleSpecific[role]];
}

function ProfileForm({ user }: { user: User }) {
    const queryClient = useQueryClient();

    const [fullName, setFullName] = useState(user.full_name ?? "");
    const [username, setUsername] = useState(user.username ?? "");
    const [bio, setBio] = useState(user.bio ?? "");
    const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");

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
            full_name: fullName.trim(),
            username: username.trim() || undefined,
            bio: bio.trim() || undefined,
            avatar_url: avatarUrl.trim() || undefined,
        });
    }

    const errorMessage =
        mutation.error instanceof ApiError
            ? mutation.error.detail
            : "Could not update profile.";

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-border bg-surface p-5 sm:p-6"
        >
            <div className="flex flex-col gap-5">
                <div>
                    <label className="text-sm text-fg-dim">Full name</label>
                    <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                        required
                    />
                </div>

                <div>
                    <label className="text-sm text-fg-dim">Username</label>
                    <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                        placeholder="yourname"
                    />
                </div>

                <div>
                    <label className="text-sm text-fg-dim">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        rows={5}
                        className="mt-2 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-fg outline-none focus:border-accent/40"
                        placeholder="Tell readers, writers, teachers, or students who you are..."
                    />
                </div>

                <div>
                    <label className="text-sm text-fg-dim">Avatar URL</label>
                    <input
                        value={avatarUrl}
                        onChange={(event) => setAvatarUrl(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                        placeholder="https://..."
                    />
                </div>

                {mutation.isError ? (
                    <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                        {errorMessage}
                    </p>
                ) : null}

                {mutation.isSuccess ? (
                    <p className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
                        Profile updated.
                    </p>
                ) : null}

                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-fit rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {mutation.isPending ? "Saving..." : "Save profile"}
                </button>
            </div>
        </form>
    );
}

export default function ProfilePage() {
    const { data: user, isLoading, isError } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: api.me,
    });

    const roleActions = useMemo(() => {
        if (!user) return [];
        return getRoleActions(user.role);
    }, [user]);

    if (isLoading) {
        return <LoadingState label="Loading profile..." />;
    }

    if (isError || !user) {
        return (
            <div className="rounded-[2rem] border border-danger/30 bg-danger-soft p-6 text-danger">
                Could not load your profile.
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <section className="rounded-[2rem] border border-border bg-surface p-5 shadow-2xl sm:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-5 sm:flex-row">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-surface-2 text-3xl font-semibold text-fg">
                            {user.full_name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
                                Profile
                            </p>

                            <h1 className="font-display mt-3 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                                {user.full_name}
                            </h1>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-surface-2 px-3 py-1 text-xs text-fg-dim">
                                    {user.role}
                                </span>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs ${user.is_verified
                                        ? "bg-success-soft text-success"
                                        : "bg-accent-soft text-accent-text"
                                        }`}
                                >
                                    {user.is_verified ? "Verified" : "Not verified"}
                                </span>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs ${user.is_active
                                        ? "bg-success-soft text-success"
                                        : "bg-danger-soft text-danger"
                                        }`}
                                >
                                    {user.is_active ? "Active" : "Suspended"}
                                </span>
                            </div>

                            <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                                {getRoleDescription(user.role)}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-border bg-surface-2 p-4 lg:min-w-72">
                        <div className="flex items-center gap-3">
                            <UserCircle className="h-5 w-5 text-fg-dim" />

                            <div>
                                <p className="text-sm font-semibold text-fg">
                                    Account identity
                                </p>
                                <p className="mt-1 text-xs text-fg-dim">{user.email}</p>
                            </div>
                        </div>

                        {user.username ? (
                            <p className="mt-4 text-sm text-fg-dim">@{user.username}</p>
                        ) : (
                            <p className="mt-4 text-sm text-fg-dim">
                                No username configured.
                            </p>
                        )}
                    </div>


                </div>


            </section>
            {/* security section */}
            <section className="rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
                <Link
                    href="/profile/security"
                    className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim transition hover:bg-surface-2"
                >
                    Security settings
                </Link>

                <Link
                    href="/profile/role-request"
                    className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
                >
                    Request role upgrade
                </Link>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[2rem] border border-border bg-surface p-5">
                    <p className="text-sm text-fg-dim">Current role</p>
                    <h2 className="font-display mt-2 text-2xl font-semibold">{user.role}</h2>
                    <p className="mt-2 text-sm leading-6 text-fg-dim">
                        Controls the tools and dashboards available to you.
                    </p>
                </div>

                <div className="rounded-[2rem] border border-border bg-surface p-5">
                    <p className="text-sm text-fg-dim">Verification</p>
                    <h2 className="font-display mt-2 text-2xl font-semibold">
                        {user.is_verified ? "Verified" : "Pending"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-fg-dim">
                        Verified profiles are more trusted by readers and learners.
                    </p>
                </div>

                <div className="rounded-[2rem] border border-border bg-surface p-5">
                    <p className="text-sm text-fg-dim">Joined</p>
                    <h2 className="font-display mt-2 text-2xl font-semibold">
                        {new Date(user.created_at).toLocaleDateString()}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-fg-dim">
                        Your account creation date.
                    </p>
                </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
                    Your workspace
                </p>

                <h2 className="font-display mt-2 text-2xl font-semibold">Recommended actions</h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {roleActions.map((action) => {
                        const Icon = action.icon;

                        return (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="rounded-2xl border border-border bg-surface-2 p-4 transition hover:bg-surface-2"
                            >
                                <Icon className="h-5 w-5 text-fg-dim" />
                                <p className="mt-3 text-sm font-semibold text-fg">
                                    {action.label}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <ProfileForm key={`${user.id}-${user.updated_at ?? user.created_at}`} user={user} />

                <aside className="h-fit rounded-[2rem] border border-border bg-surface p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
                        Public profile preview
                    </p>

                    <div className="mt-5 rounded-[2rem] border border-border bg-surface-2 p-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-2xl font-semibold">
                            {user.full_name.charAt(0).toUpperCase()}
                        </div>

                        <h3 className="font-display mt-4 text-xl font-semibold">{user.full_name}</h3>

                        {user.username ? (
                            <p className="mt-1 text-xs text-fg-dim">@{user.username}</p>
                        ) : null}

                        <p className="mt-4 text-sm leading-6 text-fg-dim">
                            {user.bio || "No bio yet."}
                        </p>

                        <p className="mt-4 rounded-full bg-surface-2 px-3 py-1 text-xs text-fg-dim">
                            {user.role}
                        </p>
                    </div>

                </aside>
            </section>

        </div>
    );
}