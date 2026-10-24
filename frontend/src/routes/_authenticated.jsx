import { Outlet, redirect, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { storage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { VisitorApprovalPopup } from "@/components/notifications/VisitorApprovalPopup";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    // Avoid immediate SSR redirection during server render / hydration
    if (typeof window === "undefined") {
      return;
    }

    const token = storage.getItem("havenly.token");
    const rf = storage.getItem("havenly.refreshToken");
    const userString = storage.getItem("havenly.user");
    let societyId = storage.getItem("havenly.societyId");

    // If completely unauthenticated, redirect to login
    if (!token && !rf) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (!societyId && user?.societyId) {
          societyId = user.societyId;
          storage.setItem("havenly.societyId", societyId);
        }
        return { user };
      } catch (e) {
        // If user state is corrupted and no tokens, redirect
        if (!token && !rf) {
          throw redirect({ to: "/login" });
        }
      }
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user: authUser, isAuthLoading } = useAuth();
  const routeContext = Route.useRouteContext();
  const user = authUser || routeContext?.user;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthLoading, user, navigate]);

  if (isAuthLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  const roleContext = user?.role || "resident";
  return (
    <DashboardLayout roleContext={roleContext}>
      <Outlet />
      {roleContext === "resident" && <VisitorApprovalPopup />}
    </DashboardLayout>
  );
}
