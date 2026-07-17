import type { usePublishFlow } from "@/hooks/usePublishFlow";

type Flow = ReturnType<typeof usePublishFlow>;

export function PublishStatusBanner({ flow }: { flow: Flow }) {
  return (
    <>
      {flow.create.isError ? (
        <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {flow.create.error}
        </p>
      ) : null}

      {flow.upload.isError ? (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <p>{flow.upload.error}</p>
          {flow.hasPendingUpload ? (
            <button
              type="button"
              onClick={() => void flow.retryUpload()}
              disabled={flow.upload.isPending}
              className="mt-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-60"
            >
              {flow.upload.isPending ? "Retrying…" : "Retry upload"}
            </button>
          ) : null}
        </div>
      ) : null}

      {flow.submit.isError ? (
        <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {flow.submit.error}
        </p>
      ) : null}

      {flow.create.isSuccess ? (
        <div className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          Draft created successfully.
        </div>
      ) : null}

      {flow.submit.isSuccess ? (
        <p className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          Content submitted for review.
        </p>
      ) : null}
    </>
  );
}
