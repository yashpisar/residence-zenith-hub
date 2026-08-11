import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries — Havenly Estates" },
      { name: "description", content: "Parcels held at the gate with resident pickup notifications." },
      { property: "og:title", content: "Deliveries — Havenly Estates" },
      { property: "og:description", content: "Parcels held at the gate with resident pickup notifications." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={Package}
      title="Deliveries"
      description="Parcels held at the gate with resident pickup notifications."
      bullets={["Parcel shelf", "Pickup OTP", "Courier log"]}
    />
  );
}
