"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import RoleGuard from "@/components/auth/RoleGuard";
import { LabeledSelect } from "@/components/editor/LabeledSelect";
import { api, ApiError } from "@/lib/api";
import type { EventType } from "@/lib/types";

const eventTypeOptions: Array<{ value: EventType; label: string }> = [
  { value: "COMPETITION", label: "Competition" },
  { value: "WORKSHOP", label: "Workshop / class" },
  { value: "BOOK_CLUB", label: "Book club" },
];

const curriculumOptions = ["CBC", "KCSE", "8-4-4", "Cambridge", "IB"];

export default function CreateEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventType>("WORKSHOP");
  const [curriculumTags, setCurriculumTags] = useState<string[]>([]);
  const [studentOnly, setStudentOnly] = useState(false);
  const [requiresPartnership, setRequiresPartnership] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api.createEvent({
        title,
        description: description || undefined,
        type,
        curriculum_tags: curriculumTags,
        student_only: studentOnly,
        requires_partnership: requiresPartnership,
        starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
        max_participants: maxParticipants ? Number(maxParticipants) : undefined,
      }),
    onSuccess: (event) => {
      router.push(`/events/${event.slug}`);
    },
  });

  function toggleTag(tag: string) {
    setCurriculumTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate();
  }

  const errorDetail =
    createMutation.error instanceof ApiError
      ? createMutation.error.detail
      : createMutation.isError
        ? "Could not create the event."
        : null;

  return (
    <RoleGuard allowedRoles={["WRITER", "TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-text" />
            <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
              Host an event
            </p>
          </div>
          <h1 className="font-display mt-3 text-2xl font-semibold text-fg sm:text-3xl">
            Create a competition, workshop, or book club
          </h1>
          <p className="mt-3 text-sm leading-6 text-fg-dim">
            Build direct relationships with students. Curriculum-tagged events
            surface to the right audience.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-[2rem] border border-border bg-surface p-6"
        >
          <div>
            <label className="text-sm text-fg-dim">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="CBC Grade 8 Poetry Competition"
              className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
            />
          </div>

          <div>
            <label className="text-sm text-fg-dim">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What should participants expect?"
              className="mt-2 w-full resize-none rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm leading-6 text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
            />
          </div>

          <LabeledSelect
            label="Event type"
            value={type}
            onChange={setType}
            options={eventTypeOptions}
          />

          <div>
            <label className="text-sm text-fg-dim">Curriculum tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {curriculumOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    curriculumTags.includes(tag)
                      ? "bg-accent text-on-accent"
                      : "border border-border bg-surface-2 text-fg-dim hover:bg-surface"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-fg-dim">Start date & time</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
              />
            </div>
            <div>
              <label className="text-sm text-fg-dim">Max participants (optional)</label>
              <input
                type="number"
                min={1}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="No limit"
                className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-dim/60 focus:border-accent/40"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-4 text-sm text-fg-dim">
            <input
              type="checkbox"
              checked={studentOnly}
              onChange={(e) => setStudentOnly(e.target.checked)}
              className="mt-1 shrink-0"
            />
            <span>
              <span className="block font-medium text-fg">Students only</span>
              <span className="mt-1 block text-xs leading-5">
                Only verified students (or accounts with the Student role) can RSVP.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-4 text-sm text-fg-dim">
            <input
              type="checkbox"
              checked={requiresPartnership}
              onChange={(e) => setRequiresPartnership(e.target.checked)}
              className="mt-1 shrink-0"
            />
            <span>
              <span className="block font-medium text-fg">
                Requires an active partnership
              </span>
              <span className="mt-1 block text-xs leading-5">
                Only readers with an active paid partnership can RSVP — good for
                premium workshops.
              </span>
            </span>
          </label>

          {errorDetail ? (
            <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {errorDetail}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim()}
            className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? "Creating..." : "Create event (draft)"}
          </button>
          <p className="text-center text-xs text-fg-dim">
            The event starts as a draft — publish it from your events dashboard
            when it&apos;s ready.
          </p>
        </form>
      </div>
    </RoleGuard>
  );
}
