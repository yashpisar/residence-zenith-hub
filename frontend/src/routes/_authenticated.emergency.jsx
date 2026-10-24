import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency — Havenly Estates" },
      {
        name: "description",
        content: "Trigger fire, medical or security alerts to the whole society.",
      },
      { property: "og:title", content: "Emergency — Havenly Estates" },
      {
        property: "og:description",
        content: "Trigger fire, medical or security alerts to the whole society.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={AlertTriangle}
      title="Emergency"
      description="Trigger fire, medical or security alerts to the whole society."
      bullets={["Alert triggers", "Escalation matrix", "Incident log"]}
    />
  );
}
