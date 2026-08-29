"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, GraduationCap, Search } from "lucide-react";

import { LabeledSelect } from "@/components/editor/LabeledSelect";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import type { SchoolType } from "@/lib/types";

const curriculumOptions = [
  { value: "CBC", label: "CBC" },
  { value: "KCSE", label: "KCSE / 8-4-4" },
  { value: "Cambridge", label: "Cambridge" },
  { value: "IB", label: "IB" },
  { value: "Other", label: "Other" },
];

const schoolTypeOptions: Array<{ value: SchoolType; label: string }> = [
  { value: "PRIMARY", label: "Primary school" },
  { value: "SECONDARY", label: "Secondary school" },
  { value: "COLLEGE", label: "College" },
  { value: "UNIVERSITY", label: "University" },
];

export default function StudentVerifyPage() {
  const queryClient = useQueryClient();

  const [schoolQuery, setSchoolQuery] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState("");
  const [curriculum, setCurriculum] = useState("CBC");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [code, setCode] = useState("");

  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolType, setNewSchoolType] = useState<SchoolType>("SECONDARY");
  const [showAddSchool, setShowAddSchool] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["students", "me"],
    queryFn: api.myStudentProfile,
  });

  const schoolsQuery = useQuery({
    queryKey: ["students", "schools", schoolQuery],
    queryFn: () => api.searchSchools(schoolQuery),
    enabled: schoolQuery.trim().length >= 2,
  });

  const createSchoolMutation = useMutation({
    mutationFn: () => api.createSchool({ name: newSchoolName, type: newSchoolType }),
    onSuccess: (school) => {
      setSelectedSchoolId(school.id);
      setShowAddSchool(false);
      queryClient.invalidateQueries({ queryKey: ["students", "schools"] });
    },
  });

  const affiliationMutation = useMutation({
    mutationFn: () =>
      api.updateStudentAffiliation({
        school_id: selectedSchoolId!,
        grade_level: gradeLevel || undefined,
        curriculum: curriculum || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students", "me"] }),
  });

  const requestVerificationMutation = useMutation({
    mutationFn: () => api.requestStudentVerification(schoolEmail),
  });

  const confirmVerificationMutation = useMutation({
    mutationFn: () => api.confirmStudentVerification(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students", "me"] }),
  });

  const profile = profileQuery.data;
  const isVerified = Boolean(profile?.verified);
  const hasAffiliation = Boolean(profile?.school_id);

  const affiliationError =
    affiliationMutation.error instanceof ApiError ? affiliationMutation.error.detail : null;
  const verifyRequestError =
    requestVerificationMutation.error instanceof ApiError
      ? requestVerificationMutation.error.detail
      : null;
  const verifyConfirmError =
    confirmVerificationMutation.error instanceof ApiError
      ? confirmVerificationMutation.error.detail
      : null;

  if (profileQuery.isLoading) {
    return <LoadingState label="Loading your student profile..." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-accent-text" />
          <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
            Student verification
          </p>
        </div>
        <h1 className="font-display mt-3 text-2xl font-semibold text-fg sm:text-3xl">
          Verify your school to unlock student pricing and events
        </h1>
        <p className="mt-3 text-sm leading-6 text-fg-dim">
          Verified students get the discounted Student Partner plan and access
          to student-only competitions, workshops, and book clubs.
        </p>

        {isVerified ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Your student status is verified
          </div>
        ) : null}
      </section>

      {/* Step 1: School affiliation */}
      <section className="rounded-[2rem] border border-border bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">Step 1</p>
        <h2 className="font-display mt-2 text-xl font-semibold">School affiliation</h2>

        {hasAffiliation ? (
          <p className="mt-3 text-sm text-fg-dim">
            School affiliation saved. You can update it below if needed.
          </p>
        ) : null}

        <div className="mt-4">
          <label className="text-sm text-fg-dim">Search for your school</label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-dim" />
            <input
              value={schoolQuery}
              onChange={(e) => setSchoolQuery(e.target.value)}
              placeholder="Start typing your school's name..."
              className="w-full rounded-2xl border border-border bg-surface-2 py-3 pl-11 pr-4 text-sm text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
            />
          </div>

          {schoolsQuery.data && schoolsQuery.data.length > 0 ? (
            <div className="mt-2 space-y-1">
              {schoolsQuery.data.map((school) => (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => setSelectedSchoolId(school.id)}
                  className={`block w-full rounded-2xl border px-4 py-2.5 text-left text-sm transition ${
                    selectedSchoolId === school.id
                      ? "border-accent/40 bg-accent-soft text-accent-text"
                      : "border-border bg-surface-2 text-fg hover:bg-surface"
                  }`}
                >
                  {school.name}
                  {school.county ? (
                    <span className="text-fg-dim"> · {school.county}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {schoolQuery.trim().length >= 2 &&
          schoolsQuery.data &&
          schoolsQuery.data.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-border bg-surface-2 p-4">
              <p className="text-sm text-fg-dim">
                Can&apos;t find your school? Add it below.
              </p>
              {showAddSchool ? (
                <div className="mt-3 space-y-3">
                  <input
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    placeholder="School name"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
                  />
                  <LabeledSelect
                    label="School type"
                    value={newSchoolType}
                    onChange={setNewSchoolType}
                    options={schoolTypeOptions}
                  />
                  <button
                    type="button"
                    onClick={() => createSchoolMutation.mutate()}
                    disabled={!newSchoolName.trim() || createSchoolMutation.isPending}
                    className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-60"
                  >
                    {createSchoolMutation.isPending ? "Adding..." : "Add school"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddSchool(true)}
                  className="mt-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim hover:bg-surface-2"
                >
                  Add my school
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-fg-dim">Grade / form level</label>
            <input
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g. Grade 8, Form 3"
              className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
            />
          </div>
          <LabeledSelect
            label="Curriculum"
            value={curriculum}
            onChange={setCurriculum}
            options={curriculumOptions}
          />
        </div>

        {affiliationError ? (
          <p className="mt-3 text-sm text-danger">{affiliationError}</p>
        ) : null}

        <button
          type="button"
          onClick={() => affiliationMutation.mutate()}
          disabled={!selectedSchoolId || affiliationMutation.isPending}
          className="mt-4 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {affiliationMutation.isPending ? "Saving..." : "Save affiliation"}
        </button>
      </section>

      {/* Step 2: Email verification */}
      {!isVerified ? (
        <section className="rounded-[2rem] border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-fg-dim">Step 2</p>
          <h2 className="font-display mt-2 text-xl font-semibold">Verify with school email</h2>
          <p className="mt-2 text-sm text-fg-dim">
            We&apos;ll send a 6-digit code to your school email address.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={schoolEmail}
              onChange={(e) => setSchoolEmail(e.target.value)}
              placeholder="you@yourschool.ac.ke"
              className="flex-1 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
            />
            <button
              type="button"
              onClick={() => requestVerificationMutation.mutate()}
              disabled={!schoolEmail.trim() || requestVerificationMutation.isPending}
              className="rounded-2xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-fg transition hover:bg-surface-2 disabled:opacity-60"
            >
              {requestVerificationMutation.isPending ? "Sending..." : "Send code"}
            </button>
          </div>

          {verifyRequestError ? (
            <p className="mt-3 text-sm text-danger">{verifyRequestError}</p>
          ) : null}

          {requestVerificationMutation.isSuccess ? (
            <div className="mt-5 border-t border-border pt-5">
              <label className="text-sm text-fg-dim">Enter the 6-digit code</label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  placeholder="123456"
                  className="flex-1 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-center text-sm tracking-[0.3em] text-fg outline-none placeholder:tracking-normal placeholder:text-fg-dim/60 focus:border-accent/40"
                />
                <button
                  type="button"
                  onClick={() => confirmVerificationMutation.mutate()}
                  disabled={code.length !== 6 || confirmVerificationMutation.isPending}
                  className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent disabled:opacity-60"
                >
                  {confirmVerificationMutation.isPending ? "Verifying..." : "Confirm"}
                </button>
              </div>
              {verifyConfirmError ? (
                <p className="mt-3 text-sm text-danger">{verifyConfirmError}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
