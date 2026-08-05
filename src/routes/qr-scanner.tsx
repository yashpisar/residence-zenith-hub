import { createFileRoute } from "@tanstack/react-router";
import { QrCode } from "lucide-react";
import { PlaceholderPage } from "@/components/app/PlaceholderPage";

export const Route = createFileRoute("/qr-scanner")({
  head: () => ({
    meta: [
      { title: "QR Scanner — Havenly Estates" },
      { name: "description", content: "Scan resident and pre-approved visitor passes at the gate." },
      { property: "og:title", content: "QR Scanner — Havenly Estates" },
      { property: "og:description", content: "Scan resident and pre-approved visitor passes at the gate." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      icon={QrCode}
      title="QR Scanner"
      description="Scan resident and pre-approved visitor passes at the gate."
      bullets={["Instant pass scan", "Offline fallback", "Fraud alerts"]}
    />
  );
}
