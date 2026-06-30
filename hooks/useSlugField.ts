import { useMemo, useState } from "react";

export function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

/**
 * Owns the title -> slug derivation as one cohesive state machine:
 *   - slug auto-follows title until the user manually edits it
 *   - once touched, the user's slug wins until they hit "auto-fill"
 *
 * This was previously three separate pieces of state (title, slug,
 * slugTouched) manipulated from multiple call sites in the page component.
 *
 * `initialSlug` (edit mode): when provided, the field starts in the
 * "touched" state — an existing slug must never silently change just
 * because the title was edited. This matters because the slug is the
 * public URL; auto-following it the way a brand-new draft does would
 * break previously-shared links without the user noticing.
 */
export function useSlugField(title: string, initialSlug?: string) {
    const [slug, setSlug] = useState(initialSlug ?? "");
    const [touched, setTouched] = useState(Boolean(initialSlug));

    const computedSlug = useMemo(() => slugify(title), [title]);

    // Auto-follow title until the user manually edits the slug field,
    // OR until an initialSlug was provided (edit mode never auto-follows).
    const displaySlug = touched ? slug : computedSlug;

    function handleSlugChange(value: string) {
        setTouched(true);
        setSlug(slugify(value));
    }

    function resetToAuto() {
        setTouched(false);
        setSlug(slugify(title));
    }

    return {
        slug: displaySlug,
        onSlugChange: handleSlugChange,
        onResetToAuto: resetToAuto,
        /** Value to submit — falls back to computed in case displaySlug is empty. */
        finalSlug: displaySlug || computedSlug,
    };
}