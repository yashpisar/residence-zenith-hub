import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Havenly Estates" },
      { name: "description", content: "Compose and schedule broadcasts to towers or the whole society." },
      { property: "og:title", content: "Announcements — Havenly Estates" },
      { property: "og:description", content: "Compose and schedule broadcasts to towers or the whole society." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={Megaphone}
      title="Announcements"
      description="Compose and schedule broadcasts to towers or the whole society."
      bullets={["Rich composer", "Audience targeting", "Scheduling"]}
    />
  );
}
