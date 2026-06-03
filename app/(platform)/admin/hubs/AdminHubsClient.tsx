"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import type { Hub } from "@/lib/types";

type HubFormPayload = {
    name: string;
    slug: string;
    description?: string | null;
    cover_image_url?: string | null;
};

export default function AdminHubsClient() {
    const queryClient = useQueryClient();

    const [editingHub, setEditingHub] = useState<Hub | null>(null);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [coverImageUrl, setCoverImageUrl] = useState("");

    const hubsQuery = useQuery({
        queryKey: ["admin", "hubs"],
        queryFn: api.adminHubs,
    });

    const createMutation = useMutation({
        mutationFn: api.createHub,
        onSuccess: () => {
            resetForm();
            invalidateHubQueries();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            hubId,
            payload,
        }: {
            hubId: string;
            payload: Partial<HubFormPayload> & { is_active?: boolean };
        }) => api.updateHub(hubId, payload),
        onSuccess: () => {
            resetForm();
            invalidateHubQueries();
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({
            hubId,
            isActive,
        }: {
            hubId: string;
            isActive: boolean;
        }) =>
            api.updateHub(hubId, {
                is_active: isActive,
            }),
        onSuccess: () => {
            invalidateHubQueries();
        },
    });

    function toggleHubStatus(hub: Hub) {
        statusMutation.mutate({
            hubId: hub.id,
            isActive: !hub.is_active,
        });
    }

    function invalidateHubQueries() {
        queryClient.invalidateQueries({ queryKey: ["hubs"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "hubs"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    }

    function resetForm() {
        setEditingHub(null);
        setName("");
        setSlug("");
        setDescription("");
        setCoverImageUrl("");
    }

    function startEdit(hub: Hub) {
        setEditingHub(hub);
        setName(hub.name ?? "");
        setSlug(hub.slug ?? "");
        setDescription(hub.description ?? "");
        setCoverImageUrl(hub.cover_image_url ?? "");
    }

    function handleNameChange(value: string) {
        setName(value);

        if (!editingHub) {
            setSlug(slugify(value));
        }
    }

    function buildPayload(): HubFormPayload {
        return {
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() ? description.trim() : null,
            cover_image_url: coverImageUrl.trim() ? coverImageUrl.trim() : null,
        };
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload = buildPayload();

        if (!payload.name || !payload.slug) {
            return;
        }

        if (editingHub) {
            updateMutation.mutate({
                hubId: editingHub.id,
                payload,
            });
            return;
        }

        createMutation.mutate(payload);
    }

    const errorMessage = useMemo(() => {
        if (createMutation.error instanceof ApiError) {
            return createMutation.error.detail;
        }

        if (updateMutation.error instanceof ApiError) {
            return updateMutation.error.detail;
        }

        if (statusMutation.error instanceof ApiError) {
            return statusMutation.error.detail;
        }

        return "Action failed.";
    }, [createMutation.error, updateMutation.error, statusMutation.error]);

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const hubs = hubsQuery.data ?? [];

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <div className="space-y-8">
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl sm:p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                        Admin Hubs
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                        Manage community hubs
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                        Hubs create focused community spaces around writers, faith,
                        education, children, poetry, and African stories.
                    </p>
                </section>

                <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
                    <form
                        onSubmit={handleSubmit}
                        className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                                    Hub form
                                </p>

                                <h2 className="mt-2 text-xl font-semibold">
                                    {editingHub ? "Edit hub" : "Create hub"}
                                </h2>
                            </div>

                            {editingHub ? (
                                <span
                                    className={`rounded-full px-3 py-1 text-xs ${editingHub.is_active
                                        ? "bg-emerald-500/10 text-emerald-200"
                                        : "bg-red-500/10 text-red-200"
                                        }`}
                                >
                                    {editingHub.is_active ? "Active" : "Inactive"}
                                </span>
                            ) : null}
                        </div>

                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="text-sm text-white/70">Name</label>
                                <input
                                    value={name}
                                    onChange={(event) => handleNameChange(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                                    placeholder="Writers Hub"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/70">Slug</label>
                                <input
                                    value={slug}
                                    onChange={(event) => setSlug(slugify(event.target.value))}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                                    placeholder="writers-hub"
                                    required
                                />

                                <p className="mt-2 text-xs text-white/35">
                                    Public URL: /hubs/{slug || "hub-slug"}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm text-white/70">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={5}
                                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-white/30"
                                    placeholder="Describe what this community hub is for..."
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/70">Cover image URL</label>
                                <input
                                    value={coverImageUrl}
                                    onChange={(event) => setCoverImageUrl(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
                                    placeholder="https://..."
                                />
                            </div>

                            {createMutation.isError || updateMutation.isError ? (
                                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {errorMessage}
                                </p>
                            ) : null}

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving
                                        ? "Saving..."
                                        : editingHub
                                            ? "Update hub"
                                            : "Create hub"}
                                </button>

                                {editingHub ? (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </form>

                    <section className="min-w-0 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                                    Existing hubs
                                </p>

                                <h2 className="mt-2 text-xl font-semibold">
                                    {hubs.length} hub{hubs.length === 1 ? "" : "s"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => hubsQuery.refetch()}
                                className="w-fit rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                            >
                                Refresh
                            </button>
                        </div>

                        {hubsQuery.isLoading ? (
                            <div className="mt-5">
                                <LoadingState label="Loading hubs..." />
                            </div>
                        ) : null}

                        {hubsQuery.isError ? (
                            <p className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                Could not load hubs. Confirm the backend is running and the
                                adminHubs API method exists.
                            </p>
                        ) : null}

                        {!hubsQuery.isLoading && !hubsQuery.isError && hubs.length > 0 ? (
                            <div className="mt-5 space-y-3">
                                {hubs.map((hub) => (
                                    <article
                                        key={hub.id}
                                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="break-words text-lg font-semibold">
                                                        {hub.name}
                                                    </h3>

                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs ${hub.is_active
                                                            ? "bg-emerald-500/10 text-emerald-200"
                                                            : "bg-red-500/10 text-red-200"
                                                            }`}
                                                    >
                                                        {hub.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </div>

                                                <p className="mt-1 break-all text-xs text-white/40">
                                                    /{hub.slug}
                                                </p>

                                                {hub.description ? (
                                                    <p className="mt-3 text-sm leading-6 text-white/60">
                                                        {hub.description}
                                                    </p>
                                                ) : (
                                                    <p className="mt-3 text-sm text-white/35">
                                                        No description provided.
                                                    </p>
                                                )}

                                                {hub.cover_image_url ? (
                                                    <p className="mt-3 break-all text-xs text-white/35">
                                                        Cover: {hub.cover_image_url}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(hub)}
                                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleHubStatus(hub)}
                                                    disabled={statusMutation.isPending}
                                                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${hub.is_active
                                                        ? "border border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/15"
                                                        : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
                                                        }`}
                                                >
                                                    {statusMutation.isPending ? "Saving..." : hub.is_active ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : null}

                        {!hubsQuery.isLoading && !hubsQuery.isError && hubs.length === 0 ? (
                            <div className="mt-5">
                                <EmptyState
                                    title="No hubs yet"
                                    description="Create your first hub for structured community discovery."
                                />
                            </div>
                        ) : null}
                    </section>
                </section>
            </div>
        </RoleGuard>
    );
}