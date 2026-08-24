import { Outlet, redirect, createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { storage } from "@/lib/storage";
import { VisitorApprovalPopup } from "@/components/notifications/VisitorApprovalPopup";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    const token = storage.getItem("havenly.token");
    const userString = storage.getItem("havenly.user");
    const societyId = storage.getItem("havenly.societyId");

    if (!token || !userString || !societyId) {
      throw redirect({ to: "/select-society", search: { redirect: location.href } });
    }

    try {
      const user = JSON.parse(userString);
      return { user };
    } catch (e) {
      throw redirect({ to: "/select-society" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const roleContext = user?.role || "resident";
  return (
    <DashboardLayout roleContext={roleContext}>
      <Outlet />
      {roleContext === "resident" && <VisitorApprovalPopup />}
    </DashboardLayout>
  );
}
