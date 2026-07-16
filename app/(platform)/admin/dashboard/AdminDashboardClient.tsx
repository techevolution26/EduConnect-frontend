"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
    FileText,
    FolderTree,
    LayoutGrid,
    PenLine,
    ShieldCheck,
    UserCog,
    Users,
} from "lucide-react";

import RoleGuard from "@/components/auth/RoleGuard";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type { UserRole } from "@/lib/types";

const roleOptions: UserRole[] = [
    "READER",
    "WRITER",
    "TEACHER",
    "STUDENT",
    "PARENT",
    "MODERATOR",
    "ADMIN",
];

function StatCard({
    label,
    value,
    helper,
}: {
    label: string;
    value: number;
    helper?: string;
}) {
    return (
        <div className="rounded-[2rem] border border-border bg-surface p-5">
            <p className="text-sm text-fg-dim">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-fg">{value}</p>
            {helper ? <p className="mt-2 text-sm text-fg-dim">{helper}</p> : null}
        </div>
    );
}

function AdminActionCard({
    href,
    title,
    description,
    icon: Icon,
}: {
    href: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <Link
            href={href}
            className="rounded-[2rem] border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-surface-2"
        >
            <Icon className="h-5 w-5 text-fg-dim" />
            <h3 className="font-display mt-4 text-lg font-semibold text-fg">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-fg-dim">{description}</p>
        </Link>
    );
}

export default function AdminDashboardClient() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "">("");

    const dashboardQuery = useQuery({
        queryKey: ["admin", "dashboard"],
        queryFn: api.adminDashboard,
    });

    const usersQuery = useQuery({
        queryKey: ["admin", "users", search, roleFilter],
        queryFn: () =>
            api.adminUsers({
                limit: 50,
                search,
                role: roleFilter || undefined,
            }),
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({
            userId,
            role,
            isVerified,
        }: {
            userId: string;
            role: UserRole;
            isVerified?: boolean;
        }) =>
            api.updateAdminUserRole(userId, {
                role,
                is_verified: isVerified,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin"] });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({
            userId,
            isActive,
        }: {
            userId: string;
            isActive: boolean;
        }) =>
            api.updateAdminUserStatus(userId, {
                is_active: isActive,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin"] });
        },
    });

    const users = usersQuery.data?.items ?? [];

    const roleCounts = useMemo(() => {
        const stats = dashboardQuery.data;

        return [
            { label: "Readers", value: stats?.total_readers ?? 0 },
            { label: "Writers", value: stats?.total_writers ?? 0 },
            { label: "Teachers", value: stats?.total_teachers ?? 0 },
            { label: "Students", value: stats?.total_students ?? 0 },
            { label: "Parents", value: stats?.total_parents ?? 0 },
            { label: "Moderators", value: stats?.total_moderators ?? 0 },
            { label: "Admins", value: stats?.total_admins ?? 0 },
        ];
    }, [dashboardQuery.data]);

    const mutationError =
        updateRoleMutation.error instanceof ApiError
            ? updateRoleMutation.error.detail
            : updateStatusMutation.error instanceof ApiError
                ? updateStatusMutation.error.detail
                : "Admin action failed.";

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <div className="space-y-8">
                <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
                        Admin Dashboard
                    </p>

                    <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                        Platform control center
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                        Manage users, roles, moderation status, publishing health,
                        partnerships, categories, and hubs from one place.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/admin/review"
                            className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent"
                        >
                            Open review queue
                        </Link>

                        <Link
                            href="/admin/content"
                            className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
                        >
                            Manage content
                        </Link>
                    </div>
                </section>

                {dashboardQuery.isLoading ? (
                    <LoadingState label="Loading dashboard stats..." />
                ) : null}

                <section className="rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
                                Admin command center
                            </p>
                            <h2 className="font-display mt-2 text-2xl font-semibold">Platform management</h2>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <AdminActionCard
                            href="/admin/content"
                            title="Manage content"
                            description="View all drafts, pending, published, rejected, and archived content."
                            icon={FileText}
                        />

                        <AdminActionCard
                            href="/admin/review"
                            title="Review queue"
                            description="Approve or reject submitted content before it appears publicly."
                            icon={ShieldCheck}
                        />

                        <AdminActionCard
                            href="/admin/categories"
                            title="Categories"
                            description="Create and manage platform-wide content categories."
                            icon={FolderTree}
                        />

                        <AdminActionCard
                            href="/admin/hubs"
                            title="Community hubs"
                            description="Create and manage structured spaces for readers and creators."
                            icon={Users}
                        />

                        <AdminActionCard
                            href="/admin/role-requests"
                            title="Role requests"
                            description="Approve users who request writer, teacher, student, or parent roles."
                            icon={UserCog}
                        />

                        <AdminActionCard
                            href="/writer/publish"
                            title="Create content"
                            description="Publish directly as an admin or seed important platform content."
                            icon={PenLine}
                        />
                    </div>
                </section>

                {dashboardQuery.data ? (
                    <>
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Total users"
                                value={dashboardQuery.data.total_users}
                                helper="All registered accounts"
                            />
                            <StatCard
                                label="Pending content"
                                value={dashboardQuery.data.pending_content}
                                helper="Needs review"
                            />
                            <StatCard
                                label="Published content"
                                value={dashboardQuery.data.published_content}
                                helper="Visible to readers"
                            />
                            <StatCard
                                label="Active partnerships"
                                value={dashboardQuery.data.active_partnerships}
                                helper="Currently active"
                            />
                        </section>

                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Total content"
                                value={dashboardQuery.data.total_content}
                            />
                            <StatCard
                                label="Rejected content"
                                value={dashboardQuery.data.rejected_content}
                            />
                            <StatCard
                                label="Categories"
                                value={dashboardQuery.data.total_categories}
                            />
                            <StatCard label="Hubs" value={dashboardQuery.data.total_hubs} />
                        </section>

                        <section className="rounded-[2rem] border border-border bg-surface p-5">
                            <h2 className="font-display text-xl font-semibold">Users by role</h2>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {roleCounts.map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-border bg-surface-2 p-4"
                                    >
                                        <p className="text-sm text-fg-dim">{item.label}</p>
                                        <p className="mt-2 text-2xl font-semibold text-fg">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                ) : null}

                <section className="rounded-[2rem] border border-border bg-surface p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">
                                Role management
                            </p>
                            <h2 className="font-display mt-2 text-2xl font-semibold">Users</h2>
                            <p className="mt-2 text-sm text-fg-dim">
                                Upgrade writers, assign teachers, create moderators, or suspend
                                unsafe accounts.
                            </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search user..."
                                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                            />

                            <select
                                value={roleFilter}
                                onChange={(event) =>
                                    setRoleFilter(event.target.value as UserRole | "")
                                }
                                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                            >
                                <option value="">All roles</option>
                                {roleOptions.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {usersQuery.isLoading ? (
                        <div className="mt-5">
                            <LoadingState label="Loading users..." />
                        </div>
                    ) : null}

                    {updateRoleMutation.isError || updateStatusMutation.isError ? (
                        <p className="mt-5 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                            {mutationError}
                        </p>
                    ) : null}

                    <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                        <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-border bg-surface px-4 py-3 text-xs uppercase tracking-[0.18em] text-fg-dim md:grid">
                            <span>User</span>
                            <span>Role</span>
                            <span>Verified</span>
                            <span>Status</span>
                            <span>Actions</span>
                        </div>

                        <div className="divide-y divide-white/10">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="grid gap-4 px-4 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center"
                                >
                                    <div>
                                        <p className="font-medium text-fg">{user.full_name}</p>
                                        <p className="mt-1 text-xs text-fg-dim">{user.email}</p>
                                        {user.username ? (
                                            <p className="mt-1 text-xs text-fg-dim">@{user.username}</p>
                                        ) : null}
                                    </div>

                                    <select
                                        value={user.role}
                                        onChange={(event) =>
                                            updateRoleMutation.mutate({
                                                userId: user.id,
                                                role: event.target.value as UserRole,
                                                isVerified: user.is_verified,
                                            })
                                        }
                                        className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-fg outline-none"
                                    >
                                        {roleOptions.map((role) => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={user.is_verified ? "true" : "false"}
                                        onChange={(event) =>
                                            updateRoleMutation.mutate({
                                                userId: user.id,
                                                role: user.role,
                                                isVerified: event.target.value === "true",
                                            })
                                        }
                                        className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-fg outline-none"
                                    >
                                        <option value="true">Verified</option>
                                        <option value="false">Not verified</option>
                                    </select>

                                    <span
                                        className={`w-fit rounded-full px-3 py-1 text-xs ${user.is_active
                                            ? "bg-success-soft text-success"
                                            : "bg-danger-soft text-danger"
                                            }`}
                                    >
                                        {user.is_active ? "Active" : "Suspended"}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateStatusMutation.mutate({
                                                userId: user.id,
                                                isActive: !user.is_active,
                                            })
                                        }
                                        className={`rounded-2xl px-4 py-2 text-sm font-semibold ${user.is_active
                                            ? "border border-danger/30 bg-danger-soft text-danger"
                                            : "border border-success/30 bg-success-soft text-success"
                                            }`}
                                    >
                                        {user.is_active ? "Suspend" : "Activate"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {usersQuery.data && usersQuery.data.items.length === 0 ? (
                        <p className="mt-5 text-sm text-fg-dim">No users found.</p>
                    ) : null}
                </section>
            </div>
        </RoleGuard>
    );
}