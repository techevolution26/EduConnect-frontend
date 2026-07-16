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
            <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
                <div className="kanga" />
                <div className="p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-accent-text">
                        Notifications
                    </p>

                    <h1 className="font-display mt-3 text-3xl tracking-tight text-fg">
                        Activity updates
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                        Track approvals, rejections, comments, follows, partnerships, and
                        system messages.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim">
                            {notificationsQuery.data?.unread_count ?? 0} unread
                        </span>

                        <button
                            type="button"
                            onClick={() => markAllMutation.mutate()}
                            disabled={markAllMutation.isPending}
                            className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-60"
                        >
                            Mark all as read
                        </button>
                    </div>
                </div>
            </section>

            {notificationsQuery.isLoading ? (
                <LoadingState label="Loading notifications..." />
            ) : null}

            {notificationsQuery.isError ? (
                <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                    Could not load notifications.
                </div>
            ) : null}

            {items.length > 0 ? (
                <section className="space-y-3">
                    {items.map((notification) => (
                        <article
                            key={notification.id}
                            className={`rounded-[2rem] border p-5 ${notification.is_read
                                ? "border-border bg-surface"
                                : "border-accent/30 bg-accent-soft"
                                }`}
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-fg-dim">
                                        {notification.notification_type}
                                    </p>

                                    <h2 className="font-display mt-2 text-lg font-semibold">
                                        {notification.title}
                                    </h2>

                                    {notification.body ? (
                                        <p className="mt-2 text-sm leading-6 text-fg-dim">
                                            {notification.body}
                                        </p>
                                    ) : null}

                                    <p className="mt-3 text-xs text-fg-dim">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </p>
                                </div>

                                {!notification.is_read ? (
                                    <button
                                        type="button"
                                        onClick={() => markOneMutation.mutate(notification.id)}
                                        className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim hover:bg-surface-2"
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