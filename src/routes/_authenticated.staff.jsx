import { createFileRoute } from "@tanstack/react-router";
import { HardHat } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff — Havenly Estates" },
      {
        name: "description",
        content: "Housekeeping, security and technicians with shifts and attendance.",
      },
      { property: "og:title", content: "Staff — Havenly Estates" },
      {
        property: "og:description",
        content: "Housekeeping, security and technicians with shifts and attendance.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={HardHat}
      title="Staff"
      description="Housekeeping, security and technicians with shifts and attendance."
      bullets={["Shift roster", "Attendance", "Task assignment"]}
    />
  );
}
