"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

export default function HubsPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["hubs"],
        queryFn: api.hubs,
    });

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
                <div className="kanga" />
                <div className="p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-accent">
                        Community hubs
                    </p>

                    <h1 className="font-display mt-3 font-display text-3xl tracking-tight text-fg">
                        Join focused communities
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                        Hubs organize the ecosystem around writers, students, teachers,
                        African stories, faith, children, and poetry.
                    </p>
                </div>
            </section>

            {isLoading ? <LoadingState label="Loading hubs..." /> : null}

            {isError ? (
                <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                    Could not load hubs.
                </div>
            ) : null}

            {data && data.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.map((hub) => (
                        <Link
                            key={hub.id}
                            href={`/hubs/${hub.slug}?id=${hub.id}`}
                            className="rounded-[2rem] border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:bg-surface-2"
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-fg-dim">
                                Hub
                            </p>

                            <h2 className="font-display mt-3 text-xl font-semibold">{hub.name}</h2>

                            {hub.description ? (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-fg-dim">
                                    {hub.description}
                                </p>
                            ) : null}
                        </Link>
                    ))}
                </section>
            ) : null}

            {data && data.length === 0 ? (
                <EmptyState
                    title="No hubs yet"
                    description="Seed your hubs from the backend seed script."
                />
            ) : null}
        </div>
    );
}