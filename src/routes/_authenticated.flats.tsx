import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/flats")({
  head: () => ({
    meta: [
      { title: "Flats — Havenly Estates" },
      { name: "description", content: "Occupancy, ownership and area data for all 412 flats." },
      { property: "og:title", content: "Flats — Havenly Estates" },
      { property: "og:description", content: "Occupancy, ownership and area data for all 412 flats." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={Building2}
      title="Flats"
      description="Occupancy, ownership and area data for all 412 flats."
      bullets={["Occupancy map", "Ownership records", "Area and tax data"]}
    />
  );
}
