"use client";

import {
    Bookmark,
    Gauge,
    Home,
    Library,
    PenLine,
    Search,
    ShieldCheck,
    UserCircle,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
}: {
    item: NavItem;
    active: boolean;
    compact?: boolean;
}) {
    const Icon = item.icon;

    if (compact) {
        return (
            <Link
                href={item.href}
                className={`flex min-w-[4.8rem] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] transition ${active
                    ? "bg-white text-black"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
            >
                <Icon className="h-4 w-4" />
                <span className="max-w-[4.2rem] truncate">{item.label}</span>
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
    const user = getStoredUser();

    const workspaceItems: NavItem[] = [
        ...(canPublish(user)
            ? [{ href: "/writer/dashboard", label: "Writer Studio", icon: PenLine }]
            : []),
        ...(canModerate(user)
            ? [{ href: "/admin/review", label: "Review Queue", icon: ShieldCheck }]
            : []),
        ...(isAdmin(user)
            ? [{ href: "/admin/dashboard", label: "Admin Dashboard", icon: Gauge }]
            : []),
    ];

    const accountItems: NavItem[] = [
        { href: "/profile", label: "Profile", icon: UserCircle },
    ];

    const mobileItems: NavItem[] = [
        { href: "/feed", label: "Feed", icon: Home },
        { href: "/library", label: "Library", icon: Bookmark },
        { href: "/search", label: "Search", icon: Search },
        ...(canPublish(user)
            ? [{ href: "/writer/dashboard", label: "Studio", icon: PenLine }]
            : []),
        ...(isAdmin(user)
            ? [{ href: "/admin/dashboard", label: "Admin", icon: Gauge }]
            : canModerate(user)
                ? [{ href: "/admin/review", label: "Review", icon: ShieldCheck }]
                : []),
        { href: "/profile", label: "Profile", icon: UserCircle },
    ];

    return (
        <>
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#09090b]/95 p-3 backdrop-blur md:flex md:flex-col xl:w-72 xl:p-4">
                <Link
                    href="/feed"
                    className="shrink-0 rounded-3xl bg-white/[0.04] p-4 xl:p-5"
                >
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/40 xl:text-xs">
                        Ecosystem
                    </p>

                    <h1 className="mt-2 truncate text-lg font-semibold tracking-tight text-white xl:text-xl">
                        Story Learning
                    </h1>

                    {user ? (
                        <p className="mt-2 truncate text-xs text-white/40">
                            {user.role} · {user.full_name}
                        </p>
                    ) : null}
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

                    <div className="shrink-0 border-t border-white/10 pt-4">
                        <NavSection
                            title="Account"
                            items={accountItems}
                            pathname={pathname}
                        />
                    </div>
                </div>
            </aside>

            <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#09090b]/95 px-2 py-2 backdrop-blur md:hidden">
                <div className="flex gap-2 overflow-x-auto">
                    {mobileItems.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            active={isActivePath(pathname, item.href)}
                            compact
                        />
                    ))}
                </div>
            </nav>
        </>
    );
}