import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { SurfaceCard } from "./SurfaceCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PlaceholderPage({
  icon,
  title,
  description,
  bullets,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <>
      <PageHeader
        icon={icon}
        title={title}
        description={description}
        actions={
          <Button onClick={() => toast.info(`${title} module is ready to be wired to your API`)}>
            <Sparkles /> Connect data
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {bullets.map((b) => (
          <SurfaceCard key={b} className="lift-on-hover">
            <div className="mb-3 grid size-11 place-items-center rounded-xl border border-primary/30 bg-primary/10">
              <Sparkles className="size-5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{b}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Wired to reusable table, form and chart components — connect your REST endpoint and it
              goes live.
            </p>
          </SurfaceCard>
        ))}
      </div>
    </>
  );
}
