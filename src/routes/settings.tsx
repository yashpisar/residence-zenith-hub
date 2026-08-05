import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Havenly Estates" },
      { name: "description", content: "Notification channels, security, language and appearance." },
      { property: "og:title", content: "Settings — Havenly Estates" },
      { property: "og:description", content: "Notification channels, security, language and appearance." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={Settings}
      title="Settings"
      description="Notification channels, security, language and appearance."
      bullets={["Notification channels", "Security and sessions", "Appearance"]}
    />
  );
}
