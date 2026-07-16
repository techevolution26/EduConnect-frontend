"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";

import RoleGuard from "@/components/auth/RoleGuard";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type { ChildrenAgeGroup } from "@/lib/types";

const ageGroupOptions: ChildrenAgeGroup[] = [
    "AGE_3_5",
    "AGE_6_9",
    "AGE_10_13",
];

const ageGroupLabels: Record<ChildrenAgeGroup, string> = {
    AGE_3_5: "3–5 years",
    AGE_6_9: "6–9 years",
    AGE_10_13: "10–13 years",
};

export default function AttachChildrenContentPage() {
    const params = useParams<{ id: string }>();
    const contentId = params.id;

    const [ageGroup, setAgeGroup] = useState<ChildrenAgeGroup>("AGE_6_9");

    const contentQuery = useQuery({
        queryKey: ["writer", "content", contentId],
        queryFn: () => api.myContentDetail(contentId),
        enabled: Boolean(contentId),
    });

    const createMutation = useMutation({
        mutationFn: () =>
            api.createChildrenContent({
                content_id: contentId,
                age_group: ageGroup,
            }),
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        createMutation.mutate();
    }

    const error =
        createMutation.error instanceof ApiError
            ? createMutation.error.detail
            : "Could not add this content to the children section.";

    const content = contentQuery.data;
    const canAttach =
        content?.content_type === "CHILDREN" && content?.status === "PUBLISHED";

    return (
        <RoleGuard allowedRoles={["MODERATOR", "ADMIN"]}>
            <div className="mx-auto max-w-4xl space-y-8">
                {contentQuery.isLoading ? (
                    <LoadingState label="Loading content..." />
                ) : null}

                {content ? (
                    <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
                        <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
                            Children’s Learning Space
                        </p>

                        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">
                            Add to children-safe library
                        </h1>

                        <p className="mt-4 text-sm leading-6 text-fg-dim">
                            Content: <strong>{content.title}</strong>
                        </p>

                        {content.content_type !== "CHILDREN" ? (
                            <p className="mt-4 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
                                This content is marked as <strong>{content.content_type}</strong>.
                                Children’s library entries require content type{" "}
                                <strong>CHILDREN</strong>.
                            </p>
                        ) : null}

                        {content.status !== "PUBLISHED" ? (
                            <p className="mt-4 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
                                This content is currently <strong>{content.status}</strong>.
                                It must be approved and published before it can be added to the
                                children’s section.
                            </p>
                        ) : null}

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href={`/writer/content/${contentId}/edit`}
                                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
                            >
                                Back to content
                            </Link>

                            {content.status === "PUBLISHED" ? (
                                <Link
                                    href={`/read/${content.slug}`}
                                    className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent"
                                >
                                    Open public page
                                </Link>
                            ) : null}
                        </div>
                    </section>
                ) : null}

                <form
                    onSubmit={handleSubmit}
                    className="grid gap-5 rounded-[2rem] border border-border bg-surface p-6"
                >
                    <div>
                        <label className="text-sm text-fg-dim">Age group</label>
                        <select
                            value={ageGroup}
                            onChange={(event) =>
                                setAgeGroup(event.target.value as ChildrenAgeGroup)
                            }
                            className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none"
                        >
                            {ageGroupOptions.map((option) => (
                                <option
                                    className="bg-surface text-fg"
                                    key={option}
                                    value={option}
                                >
                                    {ageGroupLabels[option]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface-2 p-4">
                        <h2 className="font-display text-sm font-semibold text-fg">
                            Safety requirement
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-fg-dim">
                            Only approved, published CHILDREN content can be placed in this
                            library. This keeps children’s learning curated and moderated.
                        </p>
                    </div>

                    {createMutation.isError ? (
                        <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                            {error}
                        </p>
                    ) : null}

                    {createMutation.isSuccess ? (
                        <p className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
                            Content added to the children’s library.
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={createMutation.isPending || !canAttach}
                        className="w-fit rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {createMutation.isPending
                            ? "Adding..."
                            : "Add to children’s library"}
                    </button>
                </form>
            </div>
        </RoleGuard>
    );
}