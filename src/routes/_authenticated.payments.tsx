import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Havenly Estates" },
      { name: "description", content: "Full payment history with invoices, methods and reconciliation." },
      { property: "og:title", content: "Payments — Havenly Estates" },
      { property: "og:description", content: "Full payment history with invoices, methods and reconciliation." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={Receipt}
      title="Payments"
      description="Full payment history with invoices, methods and reconciliation."
      bullets={["Invoice archive", "Payment methods", "Reconciliation"]}
    />
  );
}
