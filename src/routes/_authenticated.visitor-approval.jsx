import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/visitor-approval")({
  head: () => ({
    meta: [
      { title: "Visitor Approval — Havenly Estates" },
      {
        name: "description",
        content: "Approve or deny gate requests in realtime from your device.",
      },
      { property: "og:title", content: "Visitor Approval — Havenly Estates" },
      {
        property: "og:description",
        content: "Approve or deny gate requests in realtime from your device.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={ShieldCheck}
      title="Visitor Approval"
      description="Approve or deny gate requests in realtime from your device."
      bullets={["Live requests", "One-tap approval", "Pre-approved passes"]}
    />
  );
}
