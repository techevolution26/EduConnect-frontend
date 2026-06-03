"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import AuthGuard from "@/components/auth/AuthGuard";

const publicRoutes = ["/feed", "/read", "/partnership"];

function isPublicRoute(pathname: string) {
    return publicRoutes.some((route) => {
        if (route === "/feed") return pathname === "/feed";
        return pathname === route || pathname.startsWith(`${route}/`);
    });
}

export default function ConditionalAuthGuard({
    children,
}: {
    children: ReactNode;
}) {
    const pathname = usePathname();

    if (isPublicRoute(pathname)) {
        return <>{children}</>;
    }

    return <AuthGuard>{children}</AuthGuard>;
}