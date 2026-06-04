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
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getStoredUser } from "@/lib/auth";
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
  compact = false,
  iconOnly = false,
}: {
  item: NavItem;
  active: boolean;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const Icon = item.icon;

  if (compact || iconOnly) {
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        title={item.label}
        className={[
          "relative flex h-11 w-11 items-center justify-center rounded-2xl transition",
          active
            ? "bg-white text-black"
            : "text-white/60 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        <Icon className="h-5 w-5" />
        {active ? (
          <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-white/70" />
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${active
        ? "bg-white text-black"
        : "text-white/65 hover:bg-white/10 hover:text-white"
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
      <p className="px-4 text-[10px] uppercase tracking-[0.24em] text-white/30">
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
  const [mounted, setMounted] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  const user = useMemo(() => {
    if (!mounted) return null;
    return getStoredUser();
  }, [mounted]);

  const canShowWorkspace = mounted && !!user;

  const workspaceItems: NavItem[] = canShowWorkspace
    ? [
      ...(canPublish(user)
        ? [{ href: "/writer/dashboard", label: "Writer Studio", icon: PenLine }]
        : []),
      ...(canModerate(user)
        ? [{ href: "/admin/review", label: "Review Queue", icon: ShieldCheck }]
        : []),
      ...(isAdmin(user)
        ? [{ href: "/admin/dashboard", label: "Admin Dashboard", icon: Gauge }]
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
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#09090b]/95 p-3 backdrop-blur md:flex md:flex-col xl:w-72 xl:p-4">
        <Link
          href="/feed"
          className="shrink-0 rounded-3xl bg-white/[0.04] p-4 xl:p-5"
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/40 xl:text-xs">
            Ecosystem
          </p>

          <h1 className="mt-2 truncate text-lg font-semibold tracking-tight text-white xl:text-xl">
            EduConnect
          </h1>

          <p className="mt-2 truncate text-xs text-white/40">
            {mounted && user ? `${user.role} · ${user.full_name}` : "\u00A0"}
          </p>
        </Link>

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1 pb-4">
            <NavSection title="Main" items={primaryNavItems} pathname={pathname} />
            <NavSection title="Workspace" items={workspaceItems} pathname={pathname} />
          </nav>

          <div className="shrink-0 border-t border-white/10 pt-4">
            <NavSection
              title="Account"
              items={[{ href: "/profile", label: "Profile", icon: UserCircle }]}
              pathname={pathname}
            />
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#09090b]/95 px-3 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-2">
          {mobilePrimaryItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              compact
              iconOnly
            />
          ))}

          {workspaceItems.length > 0 ? (
            <button
              type="button"
              onClick={() => setMobileMoreOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="More"
              aria-expanded={mobileMoreOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </nav>

      {/* Mobile more drawer */}
      {mobileMoreOpen ? (
        <>
          <button
            type="button"
            aria-label="Close mobile menu backdrop"
            onClick={() => setMobileMoreOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 md:hidden"
          />

          <div className="fixed inset-x-0 bottom-[76px] z-50 mx-3 overflow-hidden rounded-3xl border border-white/10 bg-[#09090b]/95 shadow-2xl backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">More</p>
                <p className="text-xs text-white/45">Workspace and account</p>
              </div>

              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {user ? (
                <>
                  <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
                      {user.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-white/45">{user.role}</p>
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
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${active
                            ? "bg-white text-black"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
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
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${isActivePath(pathname, "/profile")
                        ? "bg-white text-black"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
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
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-white transition hover:bg-white/10"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileMoreOpen(false)}
                    className="block rounded-2xl bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-white/90"
                  >
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}