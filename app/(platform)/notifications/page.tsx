"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

export default function NotificationsPage() {
    const queryClient = useQueryClient();

    const notificationsQuery = useQuery({
        queryKey: ["notifications"],
        queryFn: api.notifications,
    });

    const markAllMutation = useMutation({
        mutationFn: api.markAllNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const markOneMutation = useMutation({
        mutationFn: api.markNotificationRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const items = notificationsQuery.data?.items ?? [];

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Notifications
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Activity updates
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Track approvals, rejections, comments, follows, partnerships, and
                    system messages.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                        {notificationsQuery.data?.unread_count ?? 0} unread
                    </span>

                    <button
                        type="button"
                        onClick={() => markAllMutation.mutate()}
                        disabled={markAllMutation.isPending}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                    >
                        Mark all as read
                    </button>
                </div>
            </section>

            {notificationsQuery.isLoading ? (
                <LoadingState label="Loading notifications..." />
            ) : null}

            {notificationsQuery.isError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Could not load notifications.
                </div>
            ) : null}

            {items.length > 0 ? (
                <section className="space-y-3">
                    {items.map((notification) => (
                        <article
                            key={notification.id}
                            className={`rounded-[2rem] border p-5 ${notification.is_read
                                    ? "border-white/10 bg-white/[0.03]"
                                    : "border-amber-400/30 bg-amber-400/10"
                                }`}
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                        {notification.notification_type}
                                    </p>

                                    <h2 className="mt-2 text-lg font-semibold">
                                        {notification.title}
                                    </h2>

                                    {notification.body ? (
                                        <p className="mt-2 text-sm leading-6 text-white/60">
                                            {notification.body}
                                        </p>
                                    ) : null}

                                    <p className="mt-3 text-xs text-white/35">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </p>
                                </div>

                                {!notification.is_read ? (
                                    <button
                                        type="button"
                                        onClick={() => markOneMutation.mutate(notification.id)}
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
                                    >
                                        Mark read
                                    </button>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </section>
            ) : null}

            {notificationsQuery.data && items.length === 0 ? (
                <EmptyState
                    title="No notifications yet"
                    description="Approvals, rejections, comments, follows, and system messages will appear here."
                />
            ) : null}
        </div>
    );
}