import { cn } from "@/lib/utils";

const tones = {
  Open: "bg-info/15 text-info border-info/30",
  "In Progress": "bg-amber/15 text-amber border-amber/30",
  Resolved: "bg-success/15 text-success border-success/30",
  Escalated: "bg-destructive/15 text-destructive border-destructive/30",
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-warning/15 text-warning border-warning/30",
  Medium: "bg-amber/15 text-amber border-amber/30",
  Low: "bg-muted text-muted-foreground border-border",
  Inside: "bg-success/15 text-success border-success/30",
  Exited: "bg-muted text-muted-foreground border-border",
  "Awaiting approval": "bg-amber/15 text-amber border-amber/30",
};

export function StatusBadge({ value }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[value] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {value}
    </span>
  );
}
