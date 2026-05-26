"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import type { CurriculumType } from "@/lib/types";

const curriculumOptions: Array<CurriculumType | ""> = [
    "",
    "CBC",
    "CBE",
    "CAMBRIDGE",
    "AMERICAN",
    "HOMESCHOOL",
    "OTHER",
];

export default function EducationPage() {
    const [curriculum, setCurriculum] = useState<CurriculumType | "">("");
    const [subject, setSubject] = useState("");
    const [gradeLevel, setGradeLevel] = useState("");

    const educationQuery = useQuery({
        queryKey: ["education", curriculum, subject, gradeLevel],
        queryFn: () =>
            api.educationResources({
                curriculum: curriculum || undefined,
                subject: subject || undefined,
                grade_level: gradeLevel || undefined,
            }),
    });

    const items = educationQuery.data ?? [];

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Education
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Learning resources
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                    Browse curriculum resources, revision material, teaching notes,
                    schemes of work, assessments, and study guides.
                </p>
            </section>

            <section className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 md:grid-cols-3">
                <select
                    value={curriculum}
                    onChange={(event) =>
                        setCurriculum(event.target.value as CurriculumType | "")
                    }
                    className="rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white"
                >
                    {curriculumOptions.map((option) => (
                        <option
                            className="bg-[#111113] text-white"
                            key={option || "ALL"}
                            value={option}
                        >
                            {option || "All curricula"}
                        </option>
                    ))}
                </select>

                <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Subject"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                />

                <input
                    value={gradeLevel}
                    onChange={(event) => setGradeLevel(event.target.value)}
                    placeholder="Grade level"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                />
            </section>

            {educationQuery.isLoading ? (
                <LoadingState label="Loading education resources..." />
            ) : null}

            {educationQuery.isError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Could not load education resources.
                </div>
            ) : null}

            {items.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((resource) => (
                        <article
                            key={resource.id}
                            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                                {resource.curriculum} • {resource.resource_type}
                            </p>

                            <h2 className="mt-3 text-xl font-semibold">
                                {resource.content?.title ?? "Untitled resource"}
                            </h2>

                            {resource.content?.excerpt ? (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                                    {resource.content.excerpt}
                                </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/45">
                                {resource.grade_level ? <span>{resource.grade_level}</span> : null}
                                {resource.subject ? <span>{resource.subject}</span> : null}
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                {resource.content?.slug ? (
                                    <Link
                                        href={`/read/${resource.content.slug}`}
                                        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
                                    >
                                        Read
                                    </Link>
                                ) : null}

                                {resource.download_url ? (
                                    <a
                                        href={resource.download_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
                                    >
                                        Download
                                    </a>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </section>
            ) : null}

            {educationQuery.data && items.length === 0 ? (
                <EmptyState
                    title="No education resources found"
                    description="Teachers can create EDUCATION content and attach learning metadata from Writer Studio."
                />
            ) : null}
        </div>
    );
}