import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — Havenly Estates" },
      { name: "description", content: "Billing cycles, dues, penalties and receipts for every flat." },
      { property: "og:title", content: "Maintenance — Havenly Estates" },
      { property: "og:description", content: "Billing cycles, dues, penalties and receipts for every flat." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={Wrench}
      title="Maintenance"
      description="Billing cycles, dues, penalties and receipts for every flat."
      bullets={["Billing cycles", "Dues and penalties", "Downloadable receipts"]}
    />
  );
}
