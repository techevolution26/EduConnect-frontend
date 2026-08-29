"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";

import RoleGuard from "@/components/auth/RoleGuard";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type { CurriculumType, EducationResourceType } from "@/lib/types";

const curriculumOptions: CurriculumType[] = [
  "CBC",
  "CBE",
  "CAMBRIDGE",
  "AMERICAN",
  "HOMESCHOOL",
  "OTHER",
];

const resourceTypeOptions: EducationResourceType[] = [
  "LESSON_NOTE",
  "REVISION",
  "STUDY_GUIDE",
  "SCHEME_OF_WORK",
  "PRINTABLE",
  "ASSESSMENT",
  "ARTICLE",
];

export default function AttachEducationResourcePage() {
  const params = useParams<{ id: string }>();
  const contentId = params.id;

  const [curriculum, setCurriculum] = useState<CurriculumType>("CBC");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [resourceType, setResourceType] =
    useState<EducationResourceType>("LESSON_NOTE");
  const [downloadUrl, setDownloadUrl] = useState("");

  const contentQuery = useQuery({
    queryKey: ["writer", "content", contentId],
    queryFn: () => api.myContentDetail(contentId),
    enabled: Boolean(contentId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createEducationResource({
        content_id: contentId,
        curriculum,
        grade_level: gradeLevel.trim() || null,
        subject: subject.trim() || null,
        resource_type: resourceType,
        download_url: downloadUrl.trim() || null,
      }),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate();
  }

  const error =
    createMutation.error instanceof ApiError
      ? createMutation.error.detail
      : "Could not attach education metadata.";

  return (
    <RoleGuard allowedRoles={["TEACHER", "WRITER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="mx-auto max-w-4xl space-y-8">
        {contentQuery.isLoading ? (
          <LoadingState label="Loading content..." />
        ) : null}

        {contentQuery.data ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">
              Education Resource
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Attach learning metadata
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/60">
              Content: <strong>{contentQuery.data.title}</strong>
            </p>

            {contentQuery.data.content_type !== "EDUCATION" ? (
              <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                This content is currently marked as{" "}
                <strong>{contentQuery.data.content_type}</strong>. Education
                metadata requires content type <strong>EDUCATION</strong>.
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/writer/content/${contentId}/edit`}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
              >
                Back to edit
              </Link>
            </div>
          </section>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">Curriculum</label>
              <select
                value={curriculum}
                onChange={(event) =>
                  setCurriculum(event.target.value as CurriculumType)
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none"
              >
                {curriculumOptions.map((option) => (
                  <option
                    className="bg-[#111113] text-white"
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-white/70">Resource type</label>
              <select
                value={resourceType}
                onChange={(event) =>
                  setResourceType(event.target.value as EducationResourceType)
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-sm text-white outline-none"
              >
                {resourceTypeOptions.map((option) => (
                  <option
                    className="bg-[#111113] text-white"
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">Grade level</label>
              <input
                value={gradeLevel}
                onChange={(event) => setGradeLevel(event.target.value)}
                placeholder="Grade 4, Form 1, Year 3..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Subject</label>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="English, CRE, Mathematics..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/70">Download URL</label>
            <input
              value={downloadUrl}
              onChange={(event) => setDownloadUrl(event.target.value)}
              placeholder="Optional PDF/resource URL"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          {createMutation.isError ? (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {createMutation.isSuccess ? (
            <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Education metadata attached successfully.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={
              createMutation.isPending ||
              contentQuery.data?.content_type !== "EDUCATION"
            }
            className="w-fit rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending
              ? "Attaching..."
              : "Attach education metadata"}
          </button>
        </form>
      </div>
    </RoleGuard>
  );
}