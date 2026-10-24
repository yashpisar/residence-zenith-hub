import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { storage } from "./storage";

const ROLE_KEY = "havenly.role";
const THEME_KEY = "havenly.theme";

export const ROLE_LABEL = {
  resident: "Resident",
  secretary: "Secretary",
  security: "Security Guard",
  superadmin: "Super Admin",
};

const AppContext = createContext(null);

function resolveTheme(mode) {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function AppProvider({ children }) {
  const [role, setRoleState] = useState("resident");
  const [theme, setThemeState] = useState("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const storedRole = storage.getItem(ROLE_KEY);
    if (storedRole) setRoleState(storedRole);
    const storedTheme = storage.getItem(THEME_KEY);
    if (storedTheme) setThemeState(storedTheme);
  }, []);

  useEffect(() => {
    const applied = resolveTheme(theme);
    const root = document.documentElement;
    root.classList.toggle("light", applied === "light");
    root.classList.toggle("dark", applied === "dark");
    root.style.colorScheme = applied;
  }, [theme]);

  const setRole = useCallback((next) => {
    setRoleState(next);
    storage.setItem(ROLE_KEY, next);
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    storage.setItem(THEME_KEY, next);
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
