import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/notices")({
  head: () => ({
    meta: [
      { title: "Notices — Havenly Estates" },
      {
        name: "description",
        content: "Society announcements, circulars and emergency broadcasts.",
      },
      { property: "og:title", content: "Notices — Havenly Estates" },
      {
        property: "og:description",
        content: "Society announcements, circulars and emergency broadcasts.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={Bell}
      title="Notices"
      description="Society announcements, circulars and emergency broadcasts."
      bullets={["Pinned notices", "Read receipts", "Emergency broadcast"]}
    />
  );
}
