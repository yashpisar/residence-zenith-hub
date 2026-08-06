import { CheckCircle2, Clock, XCircle, LogIn, LogOut, Camera, FileText } from "lucide-react";
import { motion } from "motion/react";

interface TimelineEvent {
  id: string;
  type: "registered" | "photo_captured" | "approval_requested" | "approved" | "rejected" | "pass_generated" | "checked_in" | "checked_out";
  timestamp: string;
  user: string;
  role: string;
  remarks?: string;
}

interface VisitorTimelineProps {
  events: TimelineEvent[];
}

export function VisitorTimeline({ events }: VisitorTimelineProps) {
  const getEventConfig = (type: string) => {
    switch (type) {
      case "registered": return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", label: "Visitor Registered" };
      case "photo_captured": return { icon: Camera, color: "text-purple-500", bg: "bg-purple-500/10", label: "Photo Captured" };
      case "approval_requested": return { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Approval Requested" };
      case "approved": return { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Resident Approved" };
      case "rejected": return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Resident Rejected" };
      case "checked_in": return { icon: LogIn, color: "text-primary", bg: "bg-primary/10", label: "Visitor Checked In" };
      case "checked_out": return { icon: LogOut, color: "text-slate-500", bg: "bg-slate-500/10", label: "Visitor Checked Out" };
      default: return { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: "Unknown Event" };
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-8 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:to-transparent">
      {events.map((event, idx) => {
        const config = getEventConfig(event.type);
        return (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative flex items-start gap-4"
          >
            <div className={`absolute -left-6 flex size-5 items-center justify-center rounded-full bg-background ring-4 ring-background`}>
              <div className={`size-3 rounded-full ${config.bg.replace('/10', '')}`} />
            </div>
            
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${config.bg} ${config.color} ring-4 ring-background`}>
              <config.icon className="size-5" />
            </div>
            
            <div className="flex-1 rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-sm font-bold text-foreground">{config.label}</h4>
                <time className="text-xs text-muted-foreground font-mono">{event.timestamp}</time>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">{event.user}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] uppercase font-bold tracking-wider">{event.role}</span>
              </div>
              {event.remarks && (
                <p className="mt-2 text-sm text-muted-foreground/90 italic border-l-2 border-primary/20 pl-2">
                  "{event.remarks}"
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
