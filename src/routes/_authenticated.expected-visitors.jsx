import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/expected-visitors")({
  head: () => ({
    meta: [
      { title: "Expected Visitors — Havenly Estates" },
      { name: "description", content: "Pre-approved guests arriving today with time windows." },
      { property: "og:title", content: "Expected Visitors — Havenly Estates" },
      {
        property: "og:description",
        content: "Pre-approved guests arriving today with time windows.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={CalendarClock}
      title="Expected Visitors"
      description="Pre-approved guests arriving today with time windows."
      bullets={["Today's list", "Time windows", "Auto check-in"]}
    />
  );
}
