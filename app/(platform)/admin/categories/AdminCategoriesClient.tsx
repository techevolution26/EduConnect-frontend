"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import type { Category } from "@/lib/types";

export default function AdminCategoriesClient() {
    const queryClient = useQueryClient();

    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: api.adminCategories,
    });

    const createMutation = useMutation({
        mutationFn: api.createCategory,
        onSuccess: () => {
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            categoryId,
            payload,
        }: {
            categoryId: string;
            payload: {
                name?: string;
                slug?: string;
                description?: string;
                is_active?: boolean;
            };
        }) => api.updateCategory(categoryId, payload),
        onSuccess: () => {
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        },
    });

    function resetForm() {
        setEditingCategory(null);
        setName("");
        setSlug("");
        setDescription("");
    }

    function startEdit(category: Category) {
        setEditingCategory(category);
        setName(category.name);
        setSlug(category.slug);
        setDescription(category.description ?? "");
    }

    function handleNameChange(value: string) {
        setName(value);

        if (!editingCategory) {
            setSlug(slugify(value));
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (editingCategory) {
            updateMutation.mutate({
                categoryId: editingCategory.id,
                payload: {
                    name,
                    slug,
                    description: description || undefined,
                },
            });
            return;
        }

        createMutation.mutate({
            name,
            slug,
            description: description || undefined,
        });
    }

    function toggleCategoryStatus(category: Category) {
        updateMutation.mutate({
            categoryId: category.id,
            payload: {
                is_active: !category.is_active,
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
                <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-fg-dim">
                        Admin Categories
                    </p>

                    <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">
                        Manage content categories
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-fg-dim">
                        Categories organize the main reading and discovery experience.
                        Keep names clear because readers, writers, and teachers will use
                        them across the platform.
                    </p>
                </section>

                <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
                    <form
                        onSubmit={handleSubmit}
                        className="h-fit rounded-[2rem] border border-border bg-surface p-5"
                    >
                        <h2 className="font-display text-xl font-semibold">
                            {editingCategory ? "Edit category" : "Create category"}
                        </h2>

                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="text-sm text-fg-dim">Name</label>
                                <input
                                    value={name}
                                    onChange={(event) => handleNameChange(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm text-fg-dim">Slug</label>
                                <input
                                    value={slug}
                                    onChange={(event) => setSlug(slugify(event.target.value))}
                                    className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent/40"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm text-fg-dim">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={5}
                                    className="mt-2 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-fg outline-none focus:border-accent/40"
                                />
                            </div>

                            {createMutation.isError || updateMutation.isError ? (
                                <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                                    {error}
                                </p>
                            ) : null}

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent disabled:opacity-60"
                                >
                                    {isSaving
                                        ? "Saving..."
                                        : editingCategory
                                            ? "Update category"
                                            : "Create category"}
                                </button>

                                {editingCategory ? (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg-dim hover:bg-surface-2"
                                    >
                                        Cancel
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </form>

                    <section className="rounded-[2rem] border border-border bg-surface p-5">
                        <h2 className="font-display text-xl font-semibold">Existing categories</h2>

                        {categoriesQuery.isLoading ? (
                            <div className="mt-5">
                                <LoadingState label="Loading categories..." />
                            </div>
                        ) : null}

                        {categoriesQuery.data && categoriesQuery.data.length > 0 ? (
                            <div className="mt-5 space-y-3">
                                {categoriesQuery.data.map((category) => (
                                    <article
                                        key={category.id}
                                        className="rounded-2xl border border-border bg-surface-2 p-4"
                                    >
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-display text-lg font-semibold">
                                                        {category.name}
                                                    </h3>

                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs ${category.is_active
                                                                ? "bg-success-soft text-success"
                                                                : "bg-danger-soft text-danger"
                                                            }`}
                                                    >
                                                        {category.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs text-fg-dim">
                                                    /{category.slug}
                                                </p>

                                                {category.description ? (
                                                    <p className="mt-3 text-sm leading-6 text-fg-dim">
                                                        {category.description}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(category)}
                                                    className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim hover:bg-surface-2"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleCategoryStatus(category)}
                                                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${category.is_active
                                                            ? "border border-danger/30 bg-danger-soft text-danger"
                                                            : "border border-success/30 bg-success-soft text-success"
                                                        }`}
                                                >
                                                    {category.is_active ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : null}

                        {categoriesQuery.data && categoriesQuery.data.length === 0 ? (
                            <div className="mt-5">
                                <EmptyState
                                    title="No categories yet"
                                    description="Create your first category for platform content discovery."
                                />
                            </div>
                        ) : null}
                    </section>
                </section>
            </div>
        </RoleGuard>
    );
}