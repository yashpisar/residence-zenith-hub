import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Havenly Estates" },
      { name: "description", content: "Bye-laws, AGM minutes, NOCs and audited financials in one vault." },
      { property: "og:title", content: "Documents — Havenly Estates" },
      { property: "og:description", content: "Bye-laws, AGM minutes, NOCs and audited financials in one vault." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={FileText}
      title="Documents"
      description="Bye-laws, AGM minutes, NOCs and audited financials in one vault."
      bullets={["Secure vault", "Version history", "Role-based access"]}
    />
  );
}
