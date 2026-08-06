import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { socketService } from "@/services/socket.service";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, User, Clock, Phone, Car } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

interface VisitorRequest {
  id: string;
  visitorName: string;
  phoneNumber?: string;
  visitorPhoto?: string;
  purpose: string;
  company?: string;
  vehicleNumber?: string;
  flatNumber: string;
  timestamp: string;
}

export function VisitorApprovalPopup() {
  const { user } = useAuth();
  const [request, setRequest] = useState<VisitorRequest | null>(null);

  useEffect(() => {
    if (user?.role !== "resident") return;

    const handleRequest = (data: any) => {
      // Only show popup if it's for this user's flat
      if (user.flatNumber && data.flatNumber !== user.flatNumber) return;

      setRequest({
        id: data.id || Math.random().toString(),
        visitorName: data.visitorName,
        phoneNumber: data.phoneNumber,
        visitorPhoto: data.visitorPhoto,
        purpose: data.purpose || "Delivery/Visit",
        company: data.company,
        vehicleNumber: data.vehicleNumber,
        flatNumber: data.flatNumber,
        timestamp: new Date().toISOString()
      });
    };

    socketService.on("visitor_approval_request", handleRequest);
    return () => socketService.off("visitor_approval_request", handleRequest);
  }, [user]);

  const handleAction = (approved: boolean) => {
    if (!request) return;
    
    const responsePayload = { 
      visitorId: request.id, 
      visitorName: request.visitorName,
      phoneNumber: request.phoneNumber,
      status: approved ? "approved" : "rejected" 
    };

    socketService.emit("visitor_approval_response", responsePayload);
    
    if (approved) toast.success("Visitor entry approved");
    else toast.error("Visitor entry rejected");
    
    setRequest(null);
  };

  if (!request) return null;

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && handleAction(false)}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0 shadow-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-amber-500 p-6 flex flex-col items-center justify-center text-white relative">
            <div className="absolute top-3 left-3 bg-white/20 px-2 py-1 rounded text-xs font-medium">
              Flat {request.flatNumber}
            </div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-inner mb-3">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">Visitor Request</DialogTitle>
            <DialogDescription className="text-center text-amber-100 mt-1">
              Someone is at the gate requesting entry.
            </DialogDescription>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full border-4 border-muted overflow-hidden bg-muted flex items-center justify-center shadow-md">
                {request.visitorPhoto ? (
                  <img src={request.visitorPhoto} alt={request.visitorName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">{request.visitorName}</h3>
                <p className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full inline-block mt-2">
                  {request.company ? `${request.company} • ` : ''}{request.purpose}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 bg-muted/30 p-4 rounded-xl">
              {request.phoneNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{request.phoneNumber}</span>
                </div>
              )}
              {request.vehicleNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{request.vehicleNumber}</span>
                </div>
              )}
              <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground border-t border-border pt-3 mt-1">
                <Clock className="h-4 w-4" />
                <span>Requested just now at the main gate</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 p-6 pt-0 sm:justify-between bg-card">
            <Button variant="outline" className="w-full sm:w-auto flex-1 h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleAction(false)}>
              Deny Entry
            </Button>
            <Button variant="default" className="w-full sm:w-auto flex-1 h-12 bg-success hover:bg-success/90 text-white shadow-lg shadow-success/30" onClick={() => handleAction(true)}>
              Approve Entry
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
