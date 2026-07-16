"use client";

import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ResolvedTheme,
    ThemePreference,
    applyResolvedTheme,
    getStoredThemePreference,
    resolveTheme,
    storeThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
    preference: ThemePreference;
    resolved: ResolvedTheme;
    setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      return getStoredThemePreference();
    }
    return "system";
  });
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    function sync() {
      const next = resolveTheme(preference);
      setResolved(next);
      applyResolvedTheme(next);
    }

    sync();

    if (preference === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
  }, [preference]);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    storeThemePreference(next);
  }

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return ctx;
}