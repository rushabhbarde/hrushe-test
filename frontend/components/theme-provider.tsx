"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "hrushe-theme";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(isAdminRoute ? theme : "light");
  }, [isAdminRoute, theme]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    }
    applyTheme(nextTheme);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: isAdminRoute && theme === "dark",
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    }),
    [isAdminRoute, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
