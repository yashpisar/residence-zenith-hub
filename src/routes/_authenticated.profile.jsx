import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Havenly Estates" },
      {
        name: "description",
        content: "Your flat, family members, vehicles and contact preferences.",
      },
      { property: "og:title", content: "Profile — Havenly Estates" },
      {
        property: "og:description",
        content: "Your flat, family members, vehicles and contact preferences.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={UserCircle}
      title="Profile"
      description="Your flat, family members, vehicles and contact preferences."
      bullets={["Household members", "Vehicles", "Emergency contacts"]}
    />
  );
}
