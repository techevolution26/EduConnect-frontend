"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
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
                <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                        Admin Categories
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                        Manage content categories
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                        Categories organize the main reading and discovery experience.
                        Keep names clear because readers, writers, and teachers will use
                        them across the platform.
                    </p>
                </section>

                <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
                    <form
                        onSubmit={handleSubmit}
                        className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
                    >
                        <h2 className="text-xl font-semibold">
                            {editingCategory ? "Edit category" : "Create category"}
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
                                        : editingCategory
                                            ? "Update category"
                                            : "Create category"}
                                </button>

                                {editingCategory ? (
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
                        <h2 className="text-xl font-semibold">Existing categories</h2>

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
                                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                                    >
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-semibold">
                                                        {category.name}
                                                    </h3>

                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs ${category.is_active
                                                            ? "bg-emerald-500/10 text-emerald-200"
                                                            : "bg-red-500/10 text-red-200"
                                                            }`}
                                                    >
                                                        {category.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs text-white/40">
                                                    /{category.slug}
                                                </p>

                                                {category.description ? (
                                                    <p className="mt-3 text-sm leading-6 text-white/60">
                                                        {category.description}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(category)}
                                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleCategoryStatus(category)}
                                                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${category.is_active
                                                        ? "border border-red-500/30 bg-red-500/10 text-red-100"
                                                        : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
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