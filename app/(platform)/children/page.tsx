"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import type { ChildrenAgeGroup } from "@/lib/types";

const ageGroupOptions: Array<ChildrenAgeGroup | ""> = [
    "",
    "AGE_3_5",
    "AGE_6_9",
    "AGE_10_13",
];

const ageGroupLabels: Record<ChildrenAgeGroup, string> = {
    AGE_3_5: "3–5 years",
    AGE_6_9: "6–9 years",
    AGE_10_13: "10–13 years",
};

export default function ChildrenPage() {
    const [ageGroup, setAgeGroup] = useState<ChildrenAgeGroup | "">("");

    const childrenQuery = useQuery({
        queryKey: ["children", ageGroup],
        queryFn: () =>
            api.childrenContent({
                age_group: ageGroup || undefined,
            }),
    });

    const items = childrenQuery.data ?? [];

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Children’s Space
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Safe stories and learning
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Age-grouped, moderated, child-friendly stories and learning content.
                </p>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                <label className="text-sm text-white/70">Age group</label>
                <select
                    value={ageGroup}
                    onChange={(event) =>
                        setAgeGroup(event.target.value as ChildrenAgeGroup | "")
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none md:max-w-xs"
                >
                    {ageGroupOptions.map((option) => (
                        <option
                            className="bg-[#111113] text-white"
                            key={option || "ALL"}
                            value={option}
                        >
                            {option ? ageGroupLabels[option] : "All ages"}
                        </option>
                    ))}
                </select>
            </section>

            {childrenQuery.isLoading ? (
                <LoadingState label="Loading children content..." />
            ) : null}

            {childrenQuery.isError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Could not load children content.
                </div>
            ) : null}

            {items.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <article
                            key={item.id}
                            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                {ageGroupLabels[item.age_group]}
                            </p>

                            <h2 className="mt-3 text-xl font-semibold">
                                {item.content?.title ?? "Untitled children content"}
                            </h2>

                            {item.content?.excerpt ? (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                                    {item.content.excerpt}
                                </p>
                            ) : null}

                            {item.content?.slug ? (
                                <Link
                                    href={`/read/${item.content.slug}`}
                                    className="mt-5 inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
                                >
                                    Read story
                                </Link>
                            ) : null}
                        </article>
                    ))}
                </section>
            ) : null}

            {childrenQuery.data && items.length === 0 ? (
                <EmptyState
                    title="No children content found"
                    description="Admins and moderators can attach approved CHILDREN content to the children’s library."
                />
            ) : null}
        </div>
    );
}