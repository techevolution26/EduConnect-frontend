"use client";

import Link from "next/link";
import { ReactNode } from "react";

import { getStoredUser } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

export default function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const user = getStoredUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-6 text-red-100">
        <h1 className="text-xl font-semibold">Access restricted</h1>
        <p className="mt-2 text-sm leading-6 text-red-100/75">
          Your current account role does not have permission to view this page.
        </p>

        <Link
          href="/feed"
          className="mt-5 inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}