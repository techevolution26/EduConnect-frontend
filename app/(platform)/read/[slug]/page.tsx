"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

import ContentActions from "@/components/content/ContentActions";
import CommentsSection from "@/components/content/CommentsSection";
import ContentReader from "@/components/content/ContentReader";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

// ─── Utilities ────────────────────────────────────────────────────────────────

function getScrollPercent(): number {
  if (typeof window === "undefined") return 0;

  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const viewport =
    window.innerHeight || document.documentElement.clientHeight || 0;
  const height = document.documentElement.scrollHeight || 0;

  if (height <= viewport) return 100;

  return Math.max(
    0,
    Math.min(100, Math.round(((scrollTop + viewport) / height) * 100)),
  );
}

/**
 * Finish the session using sendBeacon when available (reliable on page unload),
 * falling back to a fire-and-forget fetch for environments without sendBeacon.
 */
function finishSessionReliably(
  sessionId: string,
  payload: {
    active_seconds_delta: number;
    scroll_percent: number;
    tab_visible: boolean;
  },
) {
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    navigator.sendBeacon(`/api/read-sessions/${sessionId}/finish`, blob);
  } else {
    void api.finishReadSession(sessionId, payload);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReadPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  // All three refs are scoped to the current session.
  // A single effect owns them — no split ownership between effects.
  const sessionIdRef = useRef<string | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content", slug],
    queryFn: () => api.contentDetail(slug),
    enabled: Boolean(slug),
  });

  const contentId = data?.id ?? null;

  /**
   * Single effect that owns the entire read session lifecycle:
   *   1. Start session on mount / contentId change
   *   2. Run heartbeat interval
   *   3. Bind visibilitychange listener
   *   4. Cleanup: clear interval + remove listener + finish session
   *
   * Using one effect ensures the interval is ALWAYS cleared in the same
   * cleanup that started it — no cross-effect ref ownership issues.
   */
  useEffect(() => {
    if (!contentId) return;

    let cancelled = false;

    async function startSession() {
      try {
        const session = await api.startReadSession(contentId!);
        if (cancelled) return;

        sessionIdRef.current = session.id;
        lastTickRef.current = Date.now();

        intervalRef.current = window.setInterval(() => {
          const sessionId = sessionIdRef.current;
          const lastTick = lastTickRef.current;
          if (!sessionId || !lastTick) return;

          const now = Date.now();
          const deltaSeconds = Math.max(1, Math.floor((now - lastTick) / 1000));
          lastTickRef.current = now;

          void api.heartbeatReadSession(sessionId, {
            active_seconds_delta: deltaSeconds,
            scroll_percent: getScrollPercent(),
            tab_visible: document.visibilityState === "visible",
          });
        }, 15_000);
      } catch {
        // Session tracking is best-effort; don't surface errors to the user.
      }
    }

    function handleVisibilityChange() {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      void api.heartbeatReadSession(sessionId, {
        scroll_percent: getScrollPercent(),
        tab_visible: document.visibilityState === "visible",
      });
    }

    function handleBeforeUnload() {
      const sessionId = sessionIdRef.current;
      const lastTick = lastTickRef.current;
      if (!sessionId) return;

      const deltaSeconds =
        lastTick === null
          ? 0
          : Math.max(1, Math.floor((Date.now() - lastTick) / 1000));

      // sendBeacon is the only reliable API during page unload.
      finishSessionReliably(sessionId, {
        active_seconds_delta: deltaSeconds,
        scroll_percent: getScrollPercent(),
        tab_visible: document.visibilityState === "visible",
      });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    startSession();

    return () => {
      cancelled = true;

      // Remove listeners before finishing so a visibility event doesn't fire
      // a stale heartbeat after cleanup has started.
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Clear interval owned by this effect run.
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Finish the session on unmount / contentId change.
      const sessionId = sessionIdRef.current;
      const lastTick = lastTickRef.current;

      if (sessionId) {
        const deltaSeconds =
          lastTick === null
            ? 0
            : Math.max(1, Math.floor((Date.now() - lastTick) / 1000));

        void api.finishReadSession(sessionId, {
          active_seconds_delta: deltaSeconds,
          scroll_percent: getScrollPercent(),
          tab_visible: document.visibilityState === "visible",
        });

        // Reset refs so stale callbacks can't fire after cleanup.
        sessionIdRef.current = null;
        lastTickRef.current = null;
      }
    };
  }, [contentId]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <LoadingState label="Loading content…" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-[2rem] border border-danger/30 bg-danger-soft p-6 text-danger">
        Content could not be loaded. Refresh the page or try again.
      </div>
    );
  }

  return (
    <>
      <ContentReader content={data} />

      {data.has_access ? (
        <>
          <div className="mx-auto max-w-3xl">
            <ContentActions contentId={data.id} slug={slug} />
          </div>
          <CommentsSection contentId={data.id} slug={slug} />
        </>
      ) : null}
    </>
  );
}
