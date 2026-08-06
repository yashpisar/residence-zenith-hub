import { Outlet, redirect, createFileRoute } from "@tanstack/react-router";
import { SecretaryLayout } from "@/layouts/SecretaryLayout";

export const Route = createFileRoute("/secretary")({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem("havenly.token");
    const user = JSON.parse(localStorage.getItem("havenly.user") || "null");

    if (!token || !user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (user.role !== "secretary") {
      const pathPrefix = user.role === "security" ? "guard" : user.role;
      throw redirect({ to: `/${pathPrefix}/dashboard` });
    }
  },
  component: SecretaryLayoutComponent,
});

function SecretaryLayoutComponent() {
  return (
    <SecretaryLayout>
      <Outlet />
    </SecretaryLayout>
  );
}
