import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Role = "resident" | "secretary" | "security";
export type ThemeMode = "dark" | "light" | "system";

const ROLE_KEY = "havenly.role";
const THEME_KEY = "havenly.theme";

export const ROLE_LABEL: Record<Role, string> = {
  resident: "Resident",
  secretary: "Secretary",
  security: "Security Guard",
};

type AppState = {
  role: Role;
  setRole: (role: Role) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

const AppContext = createContext<AppState | null>(null);

function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("resident");
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem(ROLE_KEY) as Role | null;
    if (storedRole) setRoleState(storedRole);
    const storedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (storedTheme) setThemeState(storedTheme);
  }, []);

  useEffect(() => {
    const applied = resolveTheme(theme);
    const root = document.documentElement;
    root.classList.toggle("light", applied === "light");
    root.classList.toggle("dark", applied === "dark");
    root.style.colorScheme = applied;
  }, [theme]);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    localStorage.setItem(ROLE_KEY, next);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole,
      theme,
      setTheme,
      sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((v) => !v),
    }),
    [role, setRole, theme, setTheme, sidebarCollapsed],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
