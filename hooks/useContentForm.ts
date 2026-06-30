import { useEffect, useRef, useState } from "react";

import type { ContentType, ContentVisibility } from "@/lib/types";

export type ContentFormValues = {
    title: string;
    excerpt: string;
    body: string;
    contentType: ContentType;
    visibility: ContentVisibility;
    isPremium: boolean;
    categoryId: string;
    hubId: string;
};

const BLANK: ContentFormValues = {
    title: "",
    excerpt: "",
    body: "",
    contentType: "ARTICLE",
    visibility: "PUBLIC",
    isPremium: false,
    categoryId: "",
    hubId: "",
};

/**
 * Centralizes the title/excerpt/body/contentType/visibility/isPremium/
 * categoryId/hubId bundle shared by PublishPage (blank start) and
 * WriterContentEditPage (server-seeded start).
 *
 * `resync` fixes a real bug found in the original WriterContentEditPage:
 * local state was seeded once from props via useState initializers and
 * never updated again, EXCEPT when the whole component remounted via
 * `key={content.id}`. A same-ID refetch after a successful save
 * (triggered by `invalidateQueries`) would NOT remount the component, so
 * if the server response differed at all from what was optimistically
 * assumed, local state silently drifted from the server's source of truth.
 *
 * Two distinct triggers are tracked:
 *   - `entityId` changing (e.g. navigating from editing content A to B)
 *     ALWAYS resyncs, regardless of dirty state — showing stale content
 *     from a different entity is strictly worse than losing unsaved edits
 *     on a piece the user just navigated away from.
 *   - `serverVersion` changing with the SAME `entityId` (e.g. a refetch
 *     after this user's own save) only resyncs if the form has no
 *     unsaved local edits — so it never clobbers in-progress typing.
 */
export function useContentForm(
    initial?: Partial<ContentFormValues>,
    serverVersion?: string,
    entityId?: string,
) {
    const [values, setValues] = useState<ContentFormValues>({ ...BLANK, ...initial });
    const [isDirty, setIsDirty] = useState(false);
    const lastServerVersion = useRef(serverVersion);
    const lastEntityId = useRef(entityId);

    useEffect(() => {
        const entityChanged = entityId !== undefined && entityId !== lastEntityId.current;
        const versionChanged = serverVersion !== undefined && serverVersion !== lastServerVersion.current;

        if (!entityChanged && !versionChanged) return;

        lastEntityId.current = entityId;
        lastServerVersion.current = serverVersion;

        if (!initial) return;

        // Entity change always wins. Same-entity version change only resyncs
        // when there are no unsaved local edits to protect.
        if (entityChanged || !isDirty) {
            setValues({ ...BLANK, ...initial });
            setIsDirty(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverVersion, entityId]);

    function set<K extends keyof ContentFormValues>(key: K, value: ContentFormValues[K]) {
        setIsDirty(true);
        setValues((prev) => ({ ...prev, [key]: value }));
    }

    function markClean() {
        setIsDirty(false);
    }

    return { values, set, isDirty, markClean };
}