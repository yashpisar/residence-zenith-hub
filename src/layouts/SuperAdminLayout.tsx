import { DashboardLayout } from "./DashboardLayout";
import { ReactNode } from "react";

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout roleContext="superadmin">{children}</DashboardLayout>;
}
