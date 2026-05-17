"use client";

import {
    BookOpen,
    FileText,
    Gauge,
    GraduationCap,
    Home,
    Library,
    PenLine,
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

const baseNavItems: NavItem[] = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/categories", label: "Categories", icon: Library },
    { href: "/hubs", label: "Hubs", icon: Users },
    { href: "/education", label: "Education", icon: GraduationCap },
    { href: "/children", label: "Children", icon: ShieldCheck },
    { href: "/writers", label: "Writers", icon: BookOpen },
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
                className={`flex min-w-[4.6rem] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] transition ${active
                    ? "bg-white text-black"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
            >
                <Icon className="h-4 w-4" />
                <span className="max-w-[4rem] truncate">{item.label}</span>
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

export default function Sidebar() {
    const pathname = usePathname();
    const user = getStoredUser();

    const navItems: NavItem[] = [
        ...baseNavItems,
        ...(canPublish(user)
            ? [{ href: "/writer/dashboard", label: "Writer Studio", icon: PenLine }]
            : []),
        ...(canModerate(user)
            ? [{ href: "/admin/review", label: "Review Queue", icon: ShieldCheck }]
            : []),
        ...(isAdmin(user)
            ? [
                { href: "/admin/dashboard", label: "Admin Dashboard", icon: Gauge },
                { href: "/admin/content", label: "Manage Content", icon: FileText },
                { href: "/admin/categories", label: "Manage Categories", icon: Library },
                { href: "/admin/hubs", label: "Manage Hubs", icon: Users },
            ]
            : []),
        { href: "/profile", label: "Profile", icon: UserCircle },
    ];

    const mobileItems = navItems.filter((item) =>
        [
            "/feed",
            "/categories",
            "/hubs",
            "/writer/dashboard",
            "/admin/dashboard",
            "/profile",
        ].includes(item.href),
    );

    return (
        <>
            <aside className="hidden h-screen w-64 shrink-0 border-r border-white/10 bg-black/30 p-3 md:sticky md:top-0 md:block xl:w-72 xl:p-4">
                <Link
                    href="/feed"
                    className="block rounded-3xl bg-white/[0.04] p-4 xl:p-5"
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

                <nav className="mt-5 h-[calc(100vh-8.5rem)] space-y-1 overflow-y-auto pr-1 xl:mt-6 xl:space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            active={isActivePath(pathname, item.href)}
                        />
                    ))}
                </nav>
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