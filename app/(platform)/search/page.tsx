"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import ContentCard from "@/components/content/ContentCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import type { ContentType } from "@/lib/types";

const typeOptions: Array<ContentType | ""> = [
    "",
    "ARTICLE",
    "STORY",
    "POEM",
    "FAITH",
    "EDUCATION",
    "CHILDREN",
    "NEWS",
    "AUDIO",
];

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const urlQuery = searchParams.get("q") ?? "";
    const urlType = (searchParams.get("type") ?? "") as ContentType | "";

    const [q, setQ] = useState(urlQuery);
    const [type, setType] = useState<ContentType | "">(urlType);

    const activeQuery = urlQuery.trim();
    const activeType = urlType;

    const contentOnlyQuery = useQuery({
        queryKey: ["search", "content", activeQuery, activeType],
        queryFn: () =>
            api.searchContent({
                q: activeQuery,
                content_type: activeType || undefined,
                limit: 50,
            }),
        enabled: activeQuery.length >= 2 && Boolean(activeType),
    });

    const globalQuery = useQuery({
        queryKey: ["search", "global", activeQuery],
        queryFn: () =>
            api.globalSearch({
                q: activeQuery,
                limit: 10,
            }),
        enabled: activeQuery.length >= 2 && !activeType,
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const params = new URLSearchParams();
        const cleanQuery = q.trim();

        if (cleanQuery) {
            params.set("q", cleanQuery);
        }

        if (type) {
            params.set("type", type);
        }

        router.push(`/search?${params.toString()}`);
    }

    const isLoading = contentOnlyQuery.isLoading || globalQuery.isLoading;
    const isError = contentOnlyQuery.isError || globalQuery.isError;

    const contentItems = activeType
        ? contentOnlyQuery.data?.items ?? []
        : globalQuery.data?.content ?? [];

    const totalGroupedResults = useMemo(() => {
        const data = globalQuery.data;

        if (!data) return 0;

        return (
            data.content.length +
            data.writers.length +
            data.hubs.length +
            data.categories.length +
            data.education_resources.length +
            data.children_content.length
        );
    }, [globalQuery.data]);

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Search
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Find content, writers, hubs, and learning resources.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Search the ecosystem by story, poem, faith topic, curriculum, writer,
                    hub, category, or children’s content.
                </p>
            </section>

            <form
                onSubmit={handleSubmit}
                className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 md:grid-cols-[1fr_220px_auto]"
            >
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <Search className="h-4 w-4 text-white/40" />

                    <input
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder="Search faith, poetry, CBC, writers, hubs..."
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                    />
                </div>

                <select
                    value={type}
                    onChange={(event) => setType(event.target.value as ContentType | "")}
                    className="rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none"
                >
                    {typeOptions.map((option) => (
                        <option
                            className="bg-[#111113] text-white"
                            key={option || "ALL"}
                            value={option}
                        >
                            {option || "All ecosystem"}
                        </option>
                    ))}
                </select>

                <button
                    type="submit"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black"
                >
                    Search
                </button>
            </form>

            {activeQuery.length > 0 && activeQuery.length < 2 ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Type at least 2 characters to search.
                </div>
            ) : null}

            {isLoading ? <LoadingState label="Searching..." /> : null}

            {isError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Search failed. Confirm the backend search endpoint is running.
                </div>
            ) : null}

            {activeQuery.length >= 2 && activeType ? (
                <div className="text-sm text-white/45">
                    {contentOnlyQuery.data?.total ?? 0} content result(s) for “
                    {activeQuery}” in {activeType}
                </div>
            ) : null}

            {activeQuery.length >= 2 && !activeType && globalQuery.data ? (
                <div className="text-sm text-white/45">
                    {totalGroupedResults} ecosystem result(s) for “{activeQuery}”
                </div>
            ) : null}

            {activeType ? (
                <>
                    {contentItems.length > 0 ? (
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {contentItems.map((content) => (
                                <ContentCard key={content.id} content={content} />
                            ))}
                        </section>
                    ) : null}

                    {contentOnlyQuery.data && contentItems.length === 0 ? (
                        <EmptyState
                            title="No content found"
                            description="Try removing the type filter or using a broader keyword."
                        />
                    ) : null}
                </>
            ) : null}

            {!activeType && globalQuery.data ? (
                <div className="space-y-8">
                    {globalQuery.data.content.length > 0 ? (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">Content</h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {globalQuery.data.content.map((content) => (
                                    <ContentCard key={content.id} content={content} />
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {globalQuery.data.writers.length > 0 ? (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">Writers</h2>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {globalQuery.data.writers.map((writer) => (
                                    <Link
                                        key={writer.id}
                                        href={`/writers/${writer.id}`}
                                        className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                                    >
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                            {writer.role}
                                        </p>
                                        <h3 className="mt-3 text-xl font-semibold">
                                            {writer.full_name}
                                        </h3>
                                        <p className="mt-2 text-sm text-white/45">
                                            {writer.followers_count} followers •{" "}
                                            {writer.published_count} posts
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {globalQuery.data.hubs.length > 0 ? (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">Hubs</h2>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {globalQuery.data.hubs.map((hub) => (
                                    <Link
                                        key={hub.id}
                                        href={`/hubs/${hub.slug}?id=${hub.id}`}
                                        className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                                    >
                                        <h3 className="text-xl font-semibold">{hub.name}</h3>
                                        {hub.description ? (
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                                                {hub.description}
                                            </p>
                                        ) : null}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {globalQuery.data.categories.length > 0 ? (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">Categories</h2>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {globalQuery.data.categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/categories/${category.id}`}
                                        className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                                    >
                                        <h3 className="text-xl font-semibold">{category.name}</h3>
                                        {category.description ? (
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                                                {category.description}
                                            </p>
                                        ) : null}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {globalQuery.data.education_resources.length > 0 ? (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">Education resources</h2>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {globalQuery.data.education_resources.map((resource) => (
                                    <Link
                                        key={resource.id}
                                        href={
                                            resource.content?.slug
                                                ? `/read/${resource.content.slug}`
                                                : "/education"
                                        }
                                        className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                                    >
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                            {resource.curriculum} • {resource.resource_type}
                                        </p>
                                        <h3 className="mt-3 text-xl font-semibold">
                                            {resource.content?.title ?? "Education resource"}
                                        </h3>
                                        <p className="mt-2 text-sm text-white/45">
                                            {[resource.grade_level, resource.subject]
                                                .filter(Boolean)
                                                .join(" • ")}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {globalQuery.data.children_content.length > 0 ? (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">Children’s library</h2>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {globalQuery.data.children_content.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={
                                            item.content?.slug
                                                ? `/read/${item.content.slug}`
                                                : "/children"
                                        }
                                        className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                                    >
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                            {item.age_group}
                                        </p>
                                        <h3 className="mt-3 text-xl font-semibold">
                                            {item.content?.title ?? "Children content"}
                                        </h3>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {totalGroupedResults === 0 ? (
                        <EmptyState
                            title="No ecosystem results found"
                            description="Try a broader keyword or switch to a specific content type."
                        />
                    ) : null}
                </div>
            ) : null}

            {!globalQuery.data && !contentOnlyQuery.data && activeQuery.length === 0 ? (
                <EmptyState
                    title="Search the ecosystem"
                    description="Try keywords like faith, CBC, poetry, business, parenting, children, agriculture, or technology."
                />
            ) : null}
        </div>
    );
}