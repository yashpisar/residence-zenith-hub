import { Outlet, redirect, createFileRoute } from "@tanstack/react-router";
import { GuardLayout } from "@/layouts/GuardLayout";

export const Route = createFileRoute("/guard")({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem("havenly.token");
    const user = JSON.parse(localStorage.getItem("havenly.user") || "null");

    if (!token || !user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (user.role !== "security") {
      const pathPrefix = user.role === "security" ? "guard" : user.role;
      throw redirect({ to: `/${pathPrefix}/dashboard` });
    }
  },
  component: GuardLayoutComponent,
});

function GuardLayoutComponent() {
  return (
    <GuardLayout>
      <Outlet />
    </GuardLayout>
  );
}
