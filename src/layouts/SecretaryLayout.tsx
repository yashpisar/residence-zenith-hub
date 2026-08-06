import { DashboardLayout } from "./DashboardLayout";
import { ReactNode } from "react";

export function SecretaryLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout roleContext="secretary">{children}</DashboardLayout>;
}
