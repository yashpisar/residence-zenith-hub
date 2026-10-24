import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { storage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fast path from client storage
    const token = storage.getItem("havenly.token");
    const userString = storage.getItem("havenly.user");

    if (token && userString) {
      try {
        const parsed = JSON.parse(userString);
        const role = parsed?.role || user?.role;
        if (role) {
          const pathPrefix = role === "security" ? "guard" : role;
          navigate({ to: `/${pathPrefix}/dashboard`, replace: true });
          return;
        }
      } catch (e) {
        // Fallthrough
      }
    }

    // 2. When session restoration completes
    if (!isAuthLoading) {
      if (isAuthenticated && user?.role) {
        const pathPrefix = user.role === "security" ? "guard" : user.role;
        navigate({ to: `/${pathPrefix}/dashboard`, replace: true });
      } else {
        navigate({ to: "/select-society", replace: true });
      }
    }
  }, [isAuthLoading, isAuthenticated, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading Harmony Society Management...
        </p>
      </div>
    </div>
  );
}
