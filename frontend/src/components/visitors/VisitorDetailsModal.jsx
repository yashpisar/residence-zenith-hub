import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/StatusBadge";
import { User, Phone, Building2, Car, LogOut, Clock, CalendarDays, FileText, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { visitorApi } from "@/services/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function getFileUrl(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http")) return fileUrl;
  if (fileUrl.startsWith("data:")) return fileUrl;
  if (fileUrl.startsWith("/api/v1/")) return `${API_BASE.replace("/api/v1", "")}${fileUrl}`;
  return `${API_BASE.replace("/api/v1", "")}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VisitorDetailsModal({ visitor, isOpen, onClose, onStatusChange }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visitor) return null;

  const visitorId = visitor.id || visitor._id;
  const visitorName = visitor.name || visitor.visitorName || "Guest";
  const photoUrl = getFileUrl(visitor.photographUrl);
  const idPhotoUrl = getFileUrl(visitor.idProofPhoto);

  const isInside = visitor.entryTime && !visitor.exitTime;
  const isApprovedAwaitingEntry = visitor.approvalStatus === "Approved" && !visitor.entryTime;
  const isPending = visitor.approvalStatus === "Pending";

  const handleMarkExit = async () => {
    try {
      setIsSubmitting(true);
      await visitorApi.recordExit(visitorId);
      toast.success(`${visitorName} marked as exited.`);
      onStatusChange?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to record exit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsSubmitting(true);
      await visitorApi.recordEntry(visitorId);
      toast.success(`${visitorName} entry recorded.`);
      onStatusChange?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to record entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 items-center min-w-0">
              <div className="size-16 rounded-full bg-muted overflow-hidden border-2 border-primary/20 shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={visitorName}
                    className="size-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(visitorName)}&background=random`;
                    }}
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(visitorName)}&background=random`}
                    alt={visitorName}
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold truncate">{visitorName}</DialogTitle>
                <DialogDescription className="text-primary font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{visitor.purpose || "Guest"}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground truncate">{visitor.passToken || visitorId}</span>
                </DialogDescription>
              </div>
            </div>
            <StatusBadge value={visitor.status || visitor.approvalStatus} />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Primary Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contact & Identification
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2.5">
                    <Phone className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{visitor.phone || "Not provided"}</span>
                  </div>
                  {visitor.idType && (
                    <div className="flex items-center gap-2.5">
                      <User className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{visitor.idType}:</span>
                      <span className="font-semibold text-foreground">{visitor.idNumber || "—"}</span>
                    </div>
                  )}
                  {visitor.numberOfVisitors && visitor.numberOfVisitors > 1 && (
                    <div className="flex items-center gap-2.5">
                      <User className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Party Size:</span>
                      <span className="font-semibold text-foreground">{visitor.numberOfVisitors} persons</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Destination & Vehicle
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="size-4 text-primary shrink-0" />
                    <span className="font-bold text-foreground">
                      Flat {visitor.flat || `${visitor.wing || ""}-${visitor.flatNumber || ""}`}
                    </span>
                  </div>
                  {visitor.vehicleNumber && (
                    <div className="flex items-center gap-2.5">
                      <Car className="size-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">{visitor.vehicleNumber}</span>
                    </div>
                  )}
                  {visitor.registeredBy && (
                    <div className="text-xs text-muted-foreground">
                      Logged by: <span className="font-medium text-foreground capitalize">{visitor.registeredBy}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Time Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-muted/40 p-3 rounded-lg border border-border">
                <CalendarDays className="size-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">Entry Time</p>
                <p className="font-bold text-sm text-foreground mt-0.5">{formatDate(visitor.entryTime)}</p>
              </div>
              <div className="bg-muted/40 p-3 rounded-lg border border-border">
                <Clock className="size-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">Exit Time</p>
                <p className="font-bold text-sm text-foreground mt-0.5">{formatDate(visitor.exitTime)}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-muted/40 p-3 rounded-lg border border-border">
                <ShieldCheck className="size-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">Approval</p>
                <p className="font-bold text-sm text-foreground mt-0.5">{visitor.approvalStatus || "Pending"}</p>
              </div>
            </div>

            {/* Notes if available */}
            {visitor.notes && (
              <div className="p-3 bg-muted/20 border border-border rounded-lg text-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Remarks / Notes</p>
                <p className="text-foreground">{visitor.notes}</p>
              </div>
            )}

            {/* Photos Section */}
            {(photoUrl || idPhotoUrl) && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Attached Photos
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {photoUrl && (
                    <div className="border border-border rounded-lg overflow-hidden bg-black/5">
                      <p className="text-xs font-medium p-2 bg-muted/50 border-b border-border">Visitor Photo</p>
                      <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                        <img src={photoUrl} alt="Visitor" className="h-44 w-full object-cover hover:opacity-95 transition-opacity" />
                      </a>
                    </div>
                  )}
                  {idPhotoUrl && (
                    <div className="border border-border rounded-lg overflow-hidden bg-black/5">
                      <p className="text-xs font-medium p-2 bg-muted/50 border-b border-border">ID Proof Photo</p>
                      <a href={idPhotoUrl} target="_blank" rel="noopener noreferrer">
                        <img src={idPhotoUrl} alt="ID Proof" className="h-44 w-full object-cover hover:opacity-95 transition-opacity" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/20 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>

          {isApprovedAwaitingEntry && (
            <Button onClick={handleCheckIn} disabled={isSubmitting} className="font-bold">
              {isSubmitting ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
              Record Entry
            </Button>
          )}

          {isInside && (
            <Button
              onClick={handleMarkExit}
              disabled={isSubmitting}
              variant="default"
              className="shadow-lg font-bold bg-slate-800 hover:bg-slate-700 text-white"
            >
              {isSubmitting ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <LogOut className="mr-2 size-4" />}
              Mark Exit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
