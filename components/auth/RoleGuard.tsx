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
      <div className="rounded-[2rem] border border-danger/30 bg-danger-soft p-6 text-danger">
        <h1 className="font-display text-xl font-semibold">Access restricted</h1>
        <p className="mt-2 text-sm leading-6 text-danger/75">
          Your current account role does not have permission to view this page.
        </p>

        <Link
          href="/feed"
          className="mt-5 inline-flex rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}