import type { usePublishFlow } from "@/hooks/usePublishFlow";

type Flow = ReturnType<typeof usePublishFlow>;

export function PublishStatusBanner({ flow }: { flow: Flow }) {
    return (
        <>
            {flow.create.isError ? (
                <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {flow.create.error}
                </p>
            ) : null}

            {flow.upload.isError ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    <p>{flow.upload.error}</p>
                    {flow.hasPendingUpload ? (
                        <button
                            type="button"
                            onClick={() => void flow.retryUpload()}
                            disabled={flow.upload.isPending}
                            className="mt-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-50 transition hover:bg-rose-400/20 disabled:opacity-60"
                        >
                            {flow.upload.isPending ? "Retrying…" : "Retry upload"}
                        </button>
                    ) : null}
                </div>
            ) : null}

            {flow.submit.isError ? (
                <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {flow.submit.error}
                </p>
            ) : null}

            {flow.create.isSuccess ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    Draft created successfully.
                </div>
            ) : null}

            {flow.submit.isSuccess ? (
                <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    Content submitted for review.
                </p>
            ) : null}
        </>
    );
}