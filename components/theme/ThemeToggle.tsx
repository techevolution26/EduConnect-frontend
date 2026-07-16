"use client";

import { Monitor, MoonStar, SunMedium } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

const options: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
    { value: "system", label: "Match device", icon: Monitor },
    { value: "light", label: "Light", icon: SunMedium },
    { value: "dark", label: "Dark", icon: MoonStar },
];

export default function ThemeToggle({ className = "" }: { className?: string }) {
    const { preference, setPreference } = useTheme();

    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className={`inline-flex items-center gap-0.5 rounded-2xl border border-border bg-surface p-1 ${className}`}
        >
            {options.map((option) => {
                const Icon = option.icon;
                const active = preference === option.value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={option.label}
                        title={option.label}
                        onClick={() => setPreference(option.value)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${active
                                ? "bg-accent text-on-accent"
                                : "text-fg-dim hover:bg-surface-2 hover:text-fg"
                            }`}
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                );
            })}
        </div>
    );
}