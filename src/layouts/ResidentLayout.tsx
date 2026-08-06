import { DashboardLayout } from "./DashboardLayout";
import { ReactNode } from "react";
import { VisitorApprovalPopup } from "@/components/notifications/VisitorApprovalPopup";

export function ResidentLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout roleContext="resident">
      {children}
      <VisitorApprovalPopup />
    </DashboardLayout>
  );
}
