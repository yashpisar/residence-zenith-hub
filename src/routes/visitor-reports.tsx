import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/visitor-reports")({
  head: () => ({
    meta: [
      { title: "Visitor Reports — Havenly Estates" },
      { name: "description", content: "Gate analytics, peak hours and blacklisted entries." },
      { property: "og:title", content: "Visitor Reports — Havenly Estates" },
      { property: "og:description", content: "Gate analytics, peak hours and blacklisted entries." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={History}
      title="Visitor Reports"
      description="Gate analytics, peak hours and blacklisted entries."
      bullets={["Daily gate report", "Peak hour analysis", "Blacklist watch"]}
    />
  );
}
