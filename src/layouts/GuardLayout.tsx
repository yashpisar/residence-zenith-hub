import { DashboardLayout } from "./DashboardLayout";
import { ReactNode } from "react";

export function GuardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout roleContext="security">{children}</DashboardLayout>;
}
