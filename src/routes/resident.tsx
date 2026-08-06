import { Outlet, redirect, createFileRoute } from "@tanstack/react-router";
import { ResidentLayout } from "@/layouts/ResidentLayout";

export const Route = createFileRoute("/resident")({
  beforeLoad: ({ context, location }) => {
    // In a real app, this context check would be more robust, 
    // but here we check localstorage directly as a backup
    const token = localStorage.getItem("havenly.token");
    const user = JSON.parse(localStorage.getItem("havenly.user") || "null");

    if (!token || !user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (user.role !== "resident") {
      const pathPrefix = user.role === "security" ? "guard" : user.role;
      throw redirect({ to: `/${pathPrefix}/dashboard` });
    }
  },
  component: ResidentLayoutComponent,
});

function ResidentLayoutComponent() {
  return (
    <ResidentLayout>
      <Outlet />
    </ResidentLayout>
  );
}
