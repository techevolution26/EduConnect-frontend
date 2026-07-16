"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { api } from "@/lib/api";
import { getAccessToken, saveAuthSession } from "@/lib/auth";

export default function AuthGuard({ children }: { children: ReactNode }) {
    const router = useRouter();
    const token = getAccessToken();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: api.me,
        enabled: Boolean(token),
        retry: false,
    });

    useEffect(() => {
        if (!token) {
            router.replace("/login");
        }
    }, [router, token]);

    useEffect(() => {
        if (isError) {
            router.replace("/login");
        }
    }, [isError, router]);

    useEffect(() => {
        if (data && token) {
            saveAuthSession({
                access_token: token,
                token_type: "bearer",
                user: data,
            });
        }
    }, [data, token]);

    if (!token || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-fg-dim">
                Checking session...
            </div>
        );
    }

    return <>{children}</>;
}