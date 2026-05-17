"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import type { Hub } from "@/lib/types";

export default function AdminHubsPage() {
    const queryClient = useQueryClient();

    const [editingHub, setEditingHub] = useState<Hub | null>(null);

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [coverImageUrl, setCoverImageUrl] = useState("");

    const hubsQuery = useQuery({
        queryKey: ["hubs"],
        queryFn: api.hubs,
    });

    const createMutation = useMutation({
        mutationFn: api.createHub,
        onSuccess: () => {
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["hubs"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            hubId,
            payload,
        }: {
            hubId: string;
            payload: {
                name?: string;
                slug?: string;
                description?: string;
                cover_image_url?: string;
                is_active?: boolean;
            };
        }) => api.updateHub(hubId, payload),
        onSuccess: () => {
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["hubs"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        },
    });

    function resetForm() {
        setEditingHub(null);
        setName("");
        setSlug("");
        setDescription("");
        setCoverImageUrl("");
    }

    function startEdit(hub: Hub) {
        setEditingHub(hub);
        setName(hub.name);
        setSlug(hub.slug);
        setDescription(hub.description ?? "");
        setCoverImageUrl(hub.cover_image_url ?? "");
    }

    function handleNameChange(value: string) {
        setName(value);

        if (!editingHub) {
            setSlug(slugify(value));
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (editingHub) {
            updateMutation.mutate({
                hubId: editingHub.id,
                payload: {
                    name,
                    slug,
                    description: description || undefined,
                    cover_image_url: coverImageUrl || undefined,
                },
            });
            return;
        }

        createMutation.mutate({
            name,
            slug,
            description: description || undefined,
            cover_image_url: coverImageUrl || undefined,
        });
    }

    function toggleHubStatus(hub: Hub) {
        updateMutation.mutate({
            hubId: hub.id,
            payload: {
                is_active: !hub.is_active,
            },
        });
    }

    const error =
        createMutation.error instanceof ApiError
            ? createMutation.error.detail
            : updateMutation.error instanceof ApiError
                ? updateMutation.error.detail
                : "Action failed.";

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <div className="space-y-8">
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                        Admin Hubs
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                        Manage community hubs
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                        Hubs create focused community spaces around writers, faith,
                        education, children, poetry, and African stories.
                    </p>
                </section>

                <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
                    <form
                        onSubmit={handleSubmit}
                        className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
                    >
                        <h2 className="text-xl font-semibold">
                            {editingHub ? "Edit hub" : "Create hub"}
                        </h2>

                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="text-sm text-white/70">Name</label>
                                <input
                                    value={name}
                                    onChange={(event) => handleNameChange(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/70">Slug</label>
                                <input
                                    value={slug}
                                    onChange={(event) => setSlug(slugify(event.target.value))}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/70">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={5}
                                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-white/30"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/70">Cover image URL</label>
                                <input
                                    value={coverImageUrl}
                                    onChange={(event) => setCoverImageUrl(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                                    placeholder="https://..."
                                />
                            </div>

                            {createMutation.isError || updateMutation.isError ? (
                                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {error}
                                </p>
                            ) : null}

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
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
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </form>

                    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                        <h2 className="text-xl font-semibold">Existing hubs</h2>

                        {hubsQuery.isLoading ? (
                            <div className="mt-5">
                                <LoadingState label="Loading hubs..." />
                            </div>
                        ) : null}

                        {hubsQuery.data && hubsQuery.data.length > 0 ? (
                            <div className="mt-5 space-y-3">
                                {hubsQuery.data.map((hub) => (
                                    <article
                                        key={hub.id}
                                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                                    >
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-semibold">{hub.name}</h3>

                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs ${hub.is_active
                                                            ? "bg-emerald-500/10 text-emerald-200"
                                                            : "bg-red-500/10 text-red-200"
                                                            }`}
                                                    >
                                                        {hub.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs text-white/40">
                                                    /{hub.slug}
                                                </p>

                                                {hub.description ? (
                                                    <p className="mt-3 text-sm leading-6 text-white/60">
                                                        {hub.description}
                                                    </p>
                                                ) : null}

                                                {hub.cover_image_url ? (
                                                    <p className="mt-3 break-all text-xs text-white/35">
                                                        Cover: {hub.cover_image_url}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(hub)}
                                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleHubStatus(hub)}
                                                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${hub.is_active
                                                        ? "border border-red-500/30 bg-red-500/10 text-red-100"
                                                        : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                                                        }`}
                                                >
                                                    {hub.is_active ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : null}

                        {hubsQuery.data && hubsQuery.data.length === 0 ? (
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