"use client";

import {
  Bookmark,
  Gauge,
  Home,
  Library,
  Menu,
  PenLine,
  Search,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { MobileSheet } from "@/components/layout/MobileSheet";
import { SIDEBAR_WIDTH_CLASS } from "@/components/layout/layoutConstants";
import { useAuthSession } from "@/hooks/useAuthSession";
import { canModerate, canPublish, isAdmin } from "@/lib/roles";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const primaryNavItems: NavItem[] = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/library", label: "Library", icon: Bookmark },
  { href: "/search", label: "Search", icon: Search },
  { href: "/hubs", label: "Hubs", icon: Users },
  { href: "/partnership", label: "Partnership", icon: Library },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/feed") return pathname === "/feed";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  iconOnly = false,
}: {
  item: NavItem;
  active: boolean;
  iconOnly?: boolean;
}) {
  const Icon = item.icon;

  if (iconOnly) {
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        title={item.label}
        className={[
          "relative flex h-11 w-11 items-center justify-center rounded-2xl transition",
          active
            ? "bg-accent text-on-accent"
            : "text-fg-dim hover:bg-surface-2 hover:text-fg",
        ].join(" ")}
      >
        <Icon className="h-5 w-5" />
        {active ? (
          <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-surface-2" />
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
        active
          ? "bg-accent text-on-accent"
          : "text-fg-dim hover:bg-surface-2 hover:text-fg"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-2">
      <p className="px-4 text-[10px] uppercase tracking-[0.24em] text-fg-dim">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActivePath(pathname, item.href)}
          />
        ))}
      </div>
    </section>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const { user, isReady } = useAuthSession();

  const canShowWorkspace = isReady && !!user;

  const workspaceItems: NavItem[] = canShowWorkspace
    ? [
        ...(canPublish(user)
          ? [
              {
                href: "/writer/dashboard",
                label: "Writer Studio",
                icon: PenLine,
              },
            ]
          : []),
        ...(canModerate(user)
          ? [
              {
                href: "/admin/review",
                label: "Review Queue",
                icon: ShieldCheck,
              },
            ]
          : []),
        ...(isAdmin(user)
          ? [
              {
                href: "/admin/dashboard",
                label: "Admin Dashboard",
                icon: Gauge,
              },
            ]
          : []),
      ]
    : [];

  const mobilePrimaryItems: NavItem[] = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/library", label: "Library", icon: Bookmark },
    { href: "/search", label: "Search", icon: Search },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden ${SIDEBAR_WIDTH_CLASS} border-r border-border bg-ink/95 p-3 backdrop-blur md:flex md:flex-col xl:p-4`}
      >
        <Link
          href="/feed"
          className="shrink-0 overflow-hidden rounded-3xl bg-surface p-4 xl:p-5"
        >
          <span className="-mx-4 -mt-4 mb-4 block xl:-mx-5 xl:-mt-5 kanga" />

          <p className="text-[10px] uppercase tracking-[0.28em] text-fg-dim xl:text-xs">
            Ecosystem
          </p>

          <h1 className="font-display mt-2 truncate text-lg font-semibold tracking-tight text-fg xl:text-xl">
            GateWays
          </h1>

          <p className="mt-2 truncate text-xs text-fg-dim">
            {isReady && user ? `${user.role} · ${user.full_name}` : "\u00A0"}
          </p>
        </Link>

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1 pb-4">
            <NavSection
              title="Main"
              items={primaryNavItems}
              pathname={pathname}
            />
            <NavSection
              title="Workspace"
              items={workspaceItems}
              pathname={pathname}
            />
          </nav>

          <div className="shrink-0 border-t border-border pt-4">
            <NavSection
              title="Account"
              items={[{ href: "/profile", label: "Profile", icon: UserCircle }]}
              pathname={pathname}
            />
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-ink/95 px-3 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-2">
          {mobilePrimaryItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              iconOnly
            />
          ))}

          {workspaceItems.length > 0 ? (
            <button
              type="button"
              onClick={() => setMobileMoreOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl text-fg-dim transition hover:bg-surface-2 hover:text-fg"
              aria-label="More"
              aria-expanded={mobileMoreOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </nav>

      <MobileSheet
        open={mobileMoreOpen}
        onClose={() => setMobileMoreOpen(false)}
        title="More"
        description="Workspace and account"
      >
        {user ? (
          <>
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-sm font-semibold text-fg">
                {user.full_name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">
                  {user.full_name}
                </p>
                <p className="text-xs text-fg-dim">{user.role}</p>
              </div>
            </div>

            <div className="space-y-2">
              {workspaceItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                      active
                        ? "bg-accent text-on-accent"
                        : "text-fg-dim hover:bg-surface-2 hover:text-fg"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}

              <Link
                href="/profile"
                onClick={() => setMobileMoreOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  isActivePath(pathname, "/profile")
                    ? "bg-accent text-on-accent"
                    : "text-fg-dim hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <UserCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">Profile</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <Link
              href="/login"
              onClick={() => setMobileMoreOpen(false)}
              className="block rounded-2xl border border-border bg-surface px-4 py-3 text-center text-fg transition hover:bg-surface-2"
            >
              Login
            </Link>

            <Link
              href="/register"
              onClick={() => setMobileMoreOpen(false)}
              className="block rounded-2xl bg-accent px-4 py-3 text-center font-semibold text-on-accent transition hover:opacity-90"
            >
              Create account
            </Link>
          </div>
        )}
      </MobileSheet>
    </>
  );
}
