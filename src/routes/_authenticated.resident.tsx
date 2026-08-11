import { Outlet, redirect, createFileRoute } from "@tanstack/react-router";
import { storage } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/resident")({
  beforeLoad: ({ location }) => {
    const token = storage.getItem("havenly.token");
    const user = JSON.parse(storage.getItem("havenly.user") || "null");

    if (!token || !user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (user.role !== "resident") {
      const pathPrefix = user.role === "security" ? "guard" : user.role;
      throw redirect({ to: `/${pathPrefix}/dashboard` });
    }
  },
  component: () => <Outlet />,
});
