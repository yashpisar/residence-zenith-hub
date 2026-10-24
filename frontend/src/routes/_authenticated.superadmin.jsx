import { Outlet, redirect, createFileRoute } from "@tanstack/react-router";
import { storage } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/superadmin")({
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
        if (user && user.role && user.role !== "superadmin") {
          const pathPrefix = user.role === "security" ? "guard" : user.role;
          throw redirect({ to: `/${pathPrefix}/dashboard` });
        }
      } catch (e) {
        // Fallthrough
      }
    }
  },
  component: () => <Outlet />,
});
