import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { useSociety } from "./SocietyContext";
import { storage } from "@/lib/storage";

export type Role = "resident" | "secretary" | "security" | "superadmin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  flatNumber?: string;
  wing?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Mock Permissions Mapping
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  resident: ["view_own_complaints", "create_complaint", "approve_visitors", "view_notices", "view_maintenance"],
  secretary: ["manage_society", "manage_residents", "manage_complaints", "manage_maintenance", "manage_staff", "view_reports", "manage_visitors"],
  security: ["manage_visitors", "manage_deliveries", "scan_qr", "trigger_emergency", "view_visitor_history"],
  superadmin: ["manage_global_societies", "manage_society", "manage_residents", "manage_complaints", "manage_maintenance", "manage_staff", "view_reports", "manage_visitors"],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const { clearSociety } = useSociety();

  useEffect(() => {
    const storedToken = storage.getItem("havenly.token");
    const storedUser = storage.getItem("havenly.user");
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Corrupted state, clear it out
        storage.removeItem("havenly.token");
        storage.removeItem("havenly.user");
      }
    }
    setIsAuthLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    storage.setItem("havenly.token", newToken);
    storage.setItem("havenly.user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    storage.removeItem("havenly.token");
    storage.removeItem("havenly.user");
    // clearSociety(); // Optional based on requirements, but user requested keeping selected society on logout to switch users in same society
    router.navigate({ to: "/login" });
  }, [router]);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(permission);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        isAuthLoading,
        user,
        token,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
