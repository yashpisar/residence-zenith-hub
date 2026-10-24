import { Outlet, redirect, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { storage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/secretary")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;

    const token = storage.getItem("havenly.token");
    const rf = storage.getItem("havenly.refreshToken");
    const userString = storage.getItem("havenly.user");

    if (!token && !rf) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user.role && user.role !== "secretary" && user.role !== "superadmin") {
          const pathPrefix = user.role === "security" ? "guard" : user.role;
          throw redirect({ to: `/${pathPrefix}/dashboard` });
        }
      } catch (e) {
        // Fallthrough
      }
    }
  },
  component: SecretaryRouteGuard,
});

function SecretaryRouteGuard() {
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthLoading && user && user.role !== "secretary" && user.role !== "superadmin") {
      const pathPrefix = user.role === "security" ? "guard" : user.role;
      navigate({ to: `/${pathPrefix}/dashboard`, replace: true });
    }
  }, [isAuthLoading, user, navigate]);

  return <Outlet />;
}
