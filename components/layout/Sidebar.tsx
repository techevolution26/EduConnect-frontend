"use client";

import {
    BookOpen,
    GraduationCap,
    Home,
    Library,
    ShieldCheck,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/hubs", label: "Hubs", icon: Users },
    { href: "/education", label: "Education", icon: GraduationCap },
    { href: "/children", label: "Children", icon: ShieldCheck },
    { href: "/writers", label: "Writers", icon: BookOpen },
    { href: "/partnership", label: "Partnership", icon: Library },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden h-screen w-72 border-r border-white/10 bg-black/30 p-4 lg:sticky lg:top-0 lg:block">
            <Link href="/feed" className="block rounded-3xl bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                    Ecosystem
                </p>
                <h1 className="mt-2 text-xl font-semibold tracking-tight text-white">
                    Story Learning
                </h1>
            </Link>

            <nav className="mt-6 space-y-2">
                {navItems.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${active
                                    ? "bg-white text-black"
                                    : "text-white/65 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}