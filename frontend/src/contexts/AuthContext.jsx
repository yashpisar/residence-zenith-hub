import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { storage } from "@/lib/storage";
import { authApi } from "@/services/api";

const AuthContext = createContext(null);

// Role Permissions Mapping
const ROLE_PERMISSIONS = {
  resident: [
    "view_own_complaints",
    "create_complaint",
    "approve_visitors",
    "view_notices",
    "view_maintenance",
  ],
  secretary: [
    "manage_society",
    "manage_residents",
    "manage_complaints",
    "manage_maintenance",
    "manage_staff",
    "view_reports",
    "manage_visitors",
  ],
  security: [
    "manage_visitors",
    "manage_deliveries",
    "scan_qr",
    "trigger_emergency",
    "view_visitor_history",
  ],
  superadmin: [
    "manage_global_societies",
    "manage_society",
    "manage_residents",
    "manage_complaints",
    "manage_maintenance",
    "manage_staff",
    "view_reports",
    "manage_visitors",
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  // Optimistic initial hydration & background session verification
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = storage.getItem("havenly.token");
      const storedUserStr = storage.getItem("havenly.user");
      const storedRefreshToken = storage.getItem("havenly.refreshToken");
      let storedSocietyId = storage.getItem("havenly.societyId");

      let hasOptimisticUser = false;

      // 1. Fast optimistic hydrate from localStorage (no blank screen / no delay)
      if (storedToken && storedUserStr) {
        try {
          const parsedUser = JSON.parse(storedUserStr);
          if (parsedUser) {
            setToken(storedToken);
            setUser(parsedUser);
            hasOptimisticUser = true;
            if (!storedSocietyId && parsedUser.societyId) {
              storedSocietyId = parsedUser.societyId;
              storage.setItem("havenly.societyId", storedSocietyId);
            }
          }
        } catch (e) {
          console.warn("[AuthContext] Corrupted stored user state, cleaning up", e);
          storage.removeItem("havenly.token");
          storage.removeItem("havenly.user");
        }
      }

      // If we have an optimistic user, do not block page rendering
      if (hasOptimisticUser) {
        if (isMounted) setIsAuthLoading(false);
      } else if (!storedRefreshToken) {
        // No token and no refresh token: unauthenticated
        if (isMounted) setIsAuthLoading(false);
        return;
      }

      // 2. Background verify & refresh session with backend
      try {
        const res = await authApi.getMe();
        const freshUser = res?.data?.user || res?.user;
        if (freshUser && isMounted) {
          setUser(freshUser);
          storage.setItem("havenly.user", JSON.stringify(freshUser));
          if (freshUser.societyId) {
            storage.setItem("havenly.societyId", freshUser.societyId);
          }
        }
      } catch (err) {
        console.warn("[AuthContext] Session restore note:", err.message);
        // If the token was refreshed by the apiClient interceptor, update context with the new token
        const currentToken = storage.getItem("havenly.token");
        const currentUserStr = storage.getItem("havenly.user");
        if (currentToken && isMounted) {
          setToken(currentToken);
          if (currentUserStr) {
            try {
              setUser(JSON.parse(currentUserStr));
            } catch (e) {}
          }
        } else if (!currentToken && isMounted) {
          // Token refresh failed and interceptor cleared storage
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((newToken, newUser, newRefreshToken = null, newSocietyId = null) => {
    setToken(newToken);
    setUser(newUser);
    storage.setItem("havenly.token", newToken);
    storage.setItem("havenly.user", JSON.stringify(newUser));

    if (newRefreshToken) {
      storage.setItem("havenly.refreshToken", newRefreshToken);
    }

    const effectiveSocietyId = newSocietyId || newUser?.societyId;
    if (effectiveSocietyId) {
      storage.setItem("havenly.societyId", effectiveSocietyId);
    }
  }, []);

  const logout = useCallback(async () => {
    const rf = storage.getItem("havenly.refreshToken");
    if (rf) {
      try {
        await authApi.logout(rf);
      } catch (e) {}
    }
    setToken(null);
    setUser(null);
    storage.removeItem("havenly.token");
    storage.removeItem("havenly.refreshToken");
    storage.removeItem("havenly.user");
    router.navigate({ to: "/login" });
  }, [router]);

  const refreshSession = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      const freshUser = res?.data?.user || res?.user;
      if (freshUser) {
        setUser(freshUser);
        storage.setItem("havenly.user", JSON.stringify(freshUser));
        if (freshUser.societyId) {
          storage.setItem("havenly.societyId", freshUser.societyId);
        }
        return freshUser;
      }
    } catch (e) {
      console.warn("[AuthContext] refreshSession failed:", e.message);
    }
    return null;
  }, []);

  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;
      const perms = ROLE_PERMISSIONS[user.role] || [];
      return perms.includes(permission);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        isAuthLoading,
        user,
        token,
        login,
        logout,
        refreshSession,
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
