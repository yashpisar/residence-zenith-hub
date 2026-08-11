import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/public-complaints")({
  head: () => ({
    meta: [
      { title: "Public Complaints — Havenly Estates" },
      { name: "description", content: "Community-wide issues raised by neighbours, with upvotes and status." },
      { property: "og:title", content: "Public Complaints — Havenly Estates" },
      { property: "og:description", content: "Community-wide issues raised by neighbours, with upvotes and status." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={Users}
      title="Public Complaints"
      description="Community-wide issues raised by neighbours, with upvotes and status."
      bullets={["Community feed", "Upvote and follow", "Resolution timeline"]}
    />
  );
}
