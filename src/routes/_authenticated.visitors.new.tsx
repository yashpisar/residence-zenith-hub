import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, ShieldCheck, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/visitors/new")({
  head: () => ({
    meta: [
      { title: "Log New Visitor — Havenly Estates" },
      {
        name: "description",
        content: "Register a visitor at the gate and send an instant approval request to the flat.",
      },
      { property: "og:title", content: "Log New Visitor — Havenly Estates" },
      { property: "og:description", content: "Register a gate visitor and request flat approval." },
    ],
  }),
  component: NewVisitor,
});

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background/60 px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25";

const purposes = ["Guest", "Delivery", "Domestic help", "Service", "Cab"];

function NewVisitor() {
  const [purpose, setPurpose] = useState(purposes[0]);

  return (
    <>
      <PageHeader
        icon={UserPlus}
        title="New visitor entry"
        description="Capture visitor details and push an instant approval request to the resident."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Approval request sent", {
            description: "Flat B-704 has been notified. Awaiting resident response.",
          });
        }}
        className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <SurfaceCard title="Visitor details">
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["Full name", "e.g. Amit Shukla"],
              ["Mobile number", "10-digit number"],
              ["Flat to visit", "e.g. B-704"],
              ["Vehicle number", "Optional"],
            ].map(([label, ph]) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </label>
                <input className={inputClass} placeholder={ph} />
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Purpose of visit
            </p>
            <div className="flex flex-wrap gap-2">
              {purposes.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                    purpose === p
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </SurfaceCard>

        <div className="grid content-start gap-5">
          <SurfaceCard title="Photo capture">
            <div className="grid place-items-center rounded-2xl border-2 border-dashed border-border bg-background/40 p-8 text-center">
              <Camera className="size-8 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">Capture visitor photo</p>
              <p className="text-xs text-muted-foreground">Stored with the gate pass record</p>
            </div>
          </SurfaceCard>
          <SurfaceCard title="Approval">
            <p className="text-sm text-muted-foreground">
              The resident receives a realtime push notification and can approve or deny from their
              app instantly.
            </p>
            <Button type="submit" className="mt-4 w-full">
              <ShieldCheck /> Send approval request
            </Button>
            <Button type="button" variant="secondary" className="mt-2 w-full">
              Allow entry manually
            </Button>
          </SurfaceCard>
        </div>
      </form>
    </>
  );
}
