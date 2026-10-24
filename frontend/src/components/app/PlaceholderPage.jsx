import { Hammer } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { SurfaceCard } from "./SurfaceCard";
import { Button } from "@/components/ui/button";

export function PlaceholderPage({ icon, title, description, bullets }) {
  return (
    <>
      <PageHeader
        icon={icon}
        title={title}
        description={description}
      />

      <div className="mt-8 flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
          <Hammer className="size-10 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          Feature in Development
        </h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          We are currently building this feature. The {title.toLowerCase()} module will be available soon with the following capabilities:
        </p>

        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bullets?.map((b) => (
            <SurfaceCard key={b} className="p-4 text-left shadow-sm">
              <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <div className="size-2 rounded-full bg-primary" />
              </div>
              <p className="font-medium text-foreground">{b}</p>
            </SurfaceCard>
          ))}
        </div>
        
        <Button variant="outline" className="mt-12" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </>
  );
}
