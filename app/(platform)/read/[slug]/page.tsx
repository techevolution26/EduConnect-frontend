"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

import ContentActions from "@/components/content/ContentActions";
import CommentsSection from "@/components/content/CommentsSection";
import ContentReader from "@/components/content/ContentReader";
import { api } from "@/lib/api";

function getScrollPercent() {
    if (typeof window === "undefined") return 0;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewport = window.innerHeight || document.documentElement.clientHeight || 0;
    const height = document.documentElement.scrollHeight || 0;

    if (height <= viewport) return 100;

    const percent = ((scrollTop + viewport) / height) * 100;
    return Math.max(0, Math.min(100, Math.round(percent)));
}

export default function ReadPage() {
    const params = useParams<{ slug: string }>();
    const queryClient = useQueryClient();

    const sessionIdRef = useRef<string | null>(null);
    const lastTickRef = useRef<number | null>(null);
    const heartbeatRef = useRef<number | null>(null);

    const slug = params.slug;

    const { data, isLoading, isError } = useQuery({
        queryKey: ["content", slug],
        queryFn: () => api.contentDetail(slug),
        enabled: Boolean(slug),
    });

    const contentId = data?.id ?? null;

    useEffect(() => {
        if (!contentId) return;

        const currentContentId = contentId;
        let cancelled = false;

        async function startSession() {
            try {
                const session = await api.startReadSession(currentContentId);
                if (cancelled) return;

                sessionIdRef.current = session.id;
                lastTickRef.current = Date.now();

                queryClient.invalidateQueries({ queryKey: ["content", currentContentId, "counts"] });

                heartbeatRef.current = window.setInterval(() => {
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
                }, 15000);
            } catch {
                // ignore for now
            }
        }

        startSession();

        return () => {
            cancelled = true;
        };
    }, [contentId, queryClient]);

    useEffect(() => {
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
                lastTick === null ? 0 : Math.max(1, Math.floor((Date.now() - lastTick) / 1000));

            void api.finishReadSession(sessionId, {
                active_seconds_delta: deltaSeconds,
                scroll_percent: getScrollPercent(),
                tab_visible: document.visibilityState === "visible",
            });
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);

            if (heartbeatRef.current) {
                window.clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }

            const sessionId = sessionIdRef.current;
            const lastTick = lastTickRef.current;

            if (sessionId && contentId) {
                const deltaSeconds =
                    lastTick === null ? 0 : Math.max(1, Math.floor((Date.now() - lastTick) / 1000));

                void api.finishReadSession(sessionId, {
                    active_seconds_delta: deltaSeconds,
                    scroll_percent: getScrollPercent(),
                    tab_visible: document.visibilityState === "visible",
                });

                queryClient.invalidateQueries({ queryKey: ["content", contentId, "counts"] });
            }
        };
    }, [contentId, queryClient]);

    if (isLoading) {
        return <p className="text-sm text-white/50">Loading content...</p>;
    }

    if (isError || !data) {
        return (
            <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-6 text-red-100">
                Content could not be loaded.
            </div>
        );
    }

    return (
        <>
            <ContentReader content={data} />

            {data.has_access ? (
                <>
                    <div className="mx-auto max-w-3xl">
                        <ContentActions contentId={data.id} />
                    </div>

                    <CommentsSection contentId={data.id} />
                </>
            ) : null}
        </>
    );
}