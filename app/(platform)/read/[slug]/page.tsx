"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import ContentReader from "@/components/content/ContentReader";
import { api } from "@/lib/api";

export default function ReadPage() {
    const params = useParams<{ slug: string }>();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["content", params.slug],
        queryFn: () => api.contentDetail(params.slug),
        enabled: Boolean(params.slug),
    });

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

    return <ContentReader content={data} />;
}