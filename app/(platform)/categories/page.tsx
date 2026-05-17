"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

export default function CategoriesPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["categories"],
        queryFn: api.categories,
    });

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Categories
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Browse by topic
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Explore stories, education, faith, technology, parenting, agriculture,
                    and other structured content areas.
                </p>
            </section>

            {isLoading ? <LoadingState label="Loading categories..." /> : null}

            {isError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Could not load categories.
                </div>
            ) : null}

            {data && data.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.map((category) => (
                        <Link
                            key={category.id}
                            href={`/categories/${category.id}`}
                            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
                        >
                            <h2 className="text-xl font-semibold">{category.name}</h2>

                            {category.description ? (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                                    {category.description}
                                </p>
                            ) : null}
                        </Link>
                    ))}
                </section>
            ) : null}

            {data && data.length === 0 ? (
                <EmptyState
                    title="No categories yet"
                    description="Seed your categories from the backend seed script."
                />
            ) : null}
        </div>
    );
}