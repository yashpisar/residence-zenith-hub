import { Outlet, redirect, createFileRoute } from "@tanstack/react-router";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";

export const Route = createFileRoute("/superadmin")({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem("havenly.token");
    const user = JSON.parse(localStorage.getItem("havenly.user") || "null");

    if (!token || !user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (user.role !== "superadmin") {
      const pathPrefix = user.role === "security" ? "guard" : user.role;
      throw redirect({ to: `/${pathPrefix}/dashboard` });
    }
  },
  component: SuperAdminLayoutComponent,
});

function SuperAdminLayoutComponent() {
  return (
    <SuperAdminLayout>
      <Outlet />
    </SuperAdminLayout>
  );
}
