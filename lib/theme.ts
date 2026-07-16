export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "educonnect-theme";

export function getStoredThemePreference(): ThemePreference {
    if (typeof window === "undefined") return "system";

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
    }

    return "system";
}

export function storeThemePreference(preference: ThemePreference) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function getSystemTheme(): ResolvedTheme {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
    return preference === "system" ? getSystemTheme() : preference;
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
}

/**
 * Self-contained script (no imports) run via next/script with
 * strategy="beforeInteractive" so the correct theme class is on
 * <html> before first paint — this is what prevents a flash of the
 * wrong theme. Keep THEME_STORAGE_KEY in sync with the constant above.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=window.localStorage.getItem(k);var p=(s==="light"||s==="dark")?s:"system";var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=p==="system"?(d?"dark":"light"):p;var root=document.documentElement;if(r==="dark"){root.classList.add("dark");}else{root.classList.remove("dark");}root.style.colorScheme=r;}catch(e){}})();`;