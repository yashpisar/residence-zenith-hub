import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/residents")({
  head: () => ({
    meta: [
      { title: "Residents — Havenly Estates" },
      { name: "description", content: "Directory of owners and tenants across all four towers." },
      { property: "og:title", content: "Residents — Havenly Estates" },
      { property: "og:description", content: "Directory of owners and tenants across all four towers." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={Users}
      title="Residents"
      description="Directory of owners and tenants across all four towers."
      bullets={["Owner and tenant directory", "KYC documents", "Move-in and move-out"]}
    />
  );
}
