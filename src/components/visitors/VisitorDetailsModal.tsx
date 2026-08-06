import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisitorTimeline } from "./VisitorTimeline";
import { StatusBadge } from "@/components/app/StatusBadge";
import { User, Phone, MapPin, Building2, Car, LogOut, Clock, CalendarDays } from "lucide-react";
import { socketService } from "@/services/socket.service";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VisitorDetailsModalProps {
  visitor: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export function VisitorDetailsModal({ visitor, isOpen, onClose, onStatusChange }: VisitorDetailsModalProps) {
  if (!visitor) return null;

  const handleMarkExit = () => {
    socketService.emit("visitor_checked_out", visitor);
    toast.success(`${visitor.name} marked as exited.`);
    onStatusChange?.();
    onClose();
  };

  // Generate mock timeline based on status
  const mockTimeline = [
    { id: "1", type: "registered", timestamp: "09:00 AM", user: "Ramesh Guard", role: "Security" },
    { id: "2", type: "photo_captured", timestamp: "09:01 AM", user: "Ramesh Guard", role: "Security" },
    { id: "3", type: "approval_requested", timestamp: "09:01 AM", user: "System", role: "System" },
  ];
  
  if (visitor.status !== "Awaiting approval") {
    mockTimeline.push({ id: "4", type: "approved", timestamp: "09:03 AM", user: "Ananya Rao", role: "Resident", remarks: "Please leave the package at the door if I don't answer." });
    mockTimeline.push({ id: "5", type: "pass_generated", timestamp: "09:03 AM", user: "System", role: "System" });
    mockTimeline.push({ id: "6", type: "checked_in", timestamp: "09:05 AM", user: "Ramesh Guard", role: "Security" });
  }

  if (visitor.status === "Exited") {
    mockTimeline.push({ id: "7", type: "checked_out", timestamp: visitor.exit || "11:00 AM", user: "Ramesh Guard", role: "Security" });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl overflow-hidden p-0 h-[85vh] flex flex-col bg-card">
        <DialogHeader className="p-6 pb-0 border-b border-border bg-muted/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-4 items-center">
              <div className="h-16 w-16 rounded-full bg-muted overflow-hidden border-2 border-primary/20">
                <img src={`https://ui-avatars.com/api/?name=${visitor.name}&background=random`} alt={visitor.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{visitor.name}</DialogTitle>
                <DialogDescription className="text-primary font-medium mt-0.5 flex items-center gap-2">
                  {visitor.purpose} <span className="text-muted-foreground">•</span> {visitor.id}
                </DialogDescription>
              </div>
            </div>
            <StatusBadge value={visitor.status} />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border pb-1">Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 text-muted-foreground" />
                    <span className="font-medium">+91 9876543210</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span className="font-medium">Pune, Maharashtra</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">ID:</span>
                    <span className="font-bold">Aadhaar (XXXX-1234)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border pb-1">Visit Info</h4>
                <div className="space-y-3 text-sm bg-muted/30 p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <Building2 className="size-4 text-primary" />
                    <span className="font-bold text-foreground">Flat {visitor.flat}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground" />
                    <span className="font-medium">Resident Approval</span>
                  </div>
                  {visitor.vehicle && (
                    <div className="flex items-center gap-3 border-t border-border pt-2 mt-1">
                      <Car className="size-4 text-muted-foreground" />
                      <span className="font-medium">{visitor.vehicle}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted p-3 rounded-lg border border-border">
                  <CalendarDays className="size-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground font-semibold">Entry Date</p>
                  <p className="font-bold text-sm">Today</p>
                </div>
                <div className="bg-muted p-3 rounded-lg border border-border">
                  <Clock className="size-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground font-semibold">Duration</p>
                  <p className="font-bold text-sm">{visitor.exit ? "45 mins" : "Active"}</p>
                </div>
              </div>

            </div>

            <div className="bg-background rounded-xl p-5 border border-border shadow-sm">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-5">Timeline Log</h4>
              <VisitorTimeline events={mockTimeline as any} />
            </div>
          </div>
        </ScrollArea>

        {visitor.status === "Inside" && (
          <div className="p-4 bg-muted/20 border-t border-border flex justify-end">
            <Button onClick={handleMarkExit} variant="default" className="shadow-lg font-bold bg-slate-800 hover:bg-slate-700 text-white">
              <LogOut className="mr-2 size-4" /> Mark Exit
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
