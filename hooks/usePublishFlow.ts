import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { api, ApiError } from "@/lib/api";
import type { ContentType, ContentVisibility } from "@/lib/types";

type CreatePayload = {
    title: string;
    slug: string;
    excerpt?: string;
    body: string;
    content_type: ContentType;
    visibility: ContentVisibility;
    is_premium: boolean;
    category_id?: string;
    hub_id?: string;
    cover_image_url: string | null;
};

/**
 * Owns the three-step publish flow: create draft -> upload assets -> submit
 * for review.
 *
 * Fix vs. the original `handleCreate`: the original called `createMutation`
 * and `uploadAssetsMutation` back-to-back inside one async function. If
 * create succeeded but upload failed, there was no way to retry just the
 * upload — clicking the submit button again would call createContent a
 * second time, producing a duplicate draft row.
 *
 * Here, `createdContentId` persists across renders once the draft exists,
 * and `retryUpload()` re-runs only the upload step against that same ID.
 */
export function usePublishFlow() {
    const [createdContentId, setCreatedContentId] = useState<string | null>(null);
    const [pendingImages, setPendingImages] = useState<File[]>([]);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const createMutation = useMutation({ mutationFn: api.createContent });

    const uploadAssetsMutation = useMutation({
        mutationFn: ({ contentId, images, files }: { contentId: string; images: File[]; files: File[] }) =>
            api.uploadContentAssets(contentId, { images, files }),
    });

    const submitMutation = useMutation({ mutationFn: api.submitContentForReview });

    /**
     * Step 1+2: create the draft, then attempt asset upload.
     * If the draft already exists (createdContentId is set), this is a no-op —
     * call retryUpload() instead.
     */
    async function createDraft(payload: CreatePayload, images: File[], files: File[]) {
        if (createdContentId) return; // guard against duplicate-draft creation

        const content = await createMutation.mutateAsync(payload);
        setCreatedContentId(content.id);

        if (images.length > 0 || files.length > 0) {
            setPendingImages(images);
            setPendingFiles(files);
            try {
                await uploadAssetsMutation.mutateAsync({ contentId: content.id, images, files });
                setPendingImages([]);
                setPendingFiles([]);
            } catch {
                // Swallow here — uploadAssetsMutation.isError drives the UI,
                // and retryUpload() can be called against the same contentId.
            }
        }

        submitMutation.reset();
    }

    /** Step 2 retry: re-attempts upload against the existing draft, no re-create. */
    async function retryUpload() {
        if (!createdContentId) return;
        if (pendingImages.length === 0 && pendingFiles.length === 0) return;

        await uploadAssetsMutation.mutateAsync({
            contentId: createdContentId,
            images: pendingImages,
            files: pendingFiles,
        });
        setPendingImages([]);
        setPendingFiles([]);
    }

    /** Step 3: submit the created draft for review. */
    function submitForReview() {
        if (!createdContentId) return;
        submitMutation.mutate(createdContentId);
    }

    const createError =
        createMutation.error instanceof ApiError ? createMutation.error.detail : "Could not create content.";
    const uploadError =
        uploadAssetsMutation.error instanceof ApiError
            ? uploadAssetsMutation.error.detail
            : "Could not upload attachments.";
    const submitError =
        submitMutation.error instanceof ApiError ? submitMutation.error.detail : "Could not submit content.";

    const hasPendingUpload = pendingImages.length > 0 || pendingFiles.length > 0;

    return {
        createdContentId,
        createDraft,
        retryUpload,
        submitForReview,
        hasPendingUpload,
        create: { isPending: createMutation.isPending, isError: createMutation.isError, isSuccess: createMutation.isSuccess, error: createError },
        upload: { isPending: uploadAssetsMutation.isPending, isError: uploadAssetsMutation.isError, error: uploadError },
        submit: { isPending: submitMutation.isPending, isError: submitMutation.isError, isSuccess: submitMutation.isSuccess, error: submitError },
    };
}