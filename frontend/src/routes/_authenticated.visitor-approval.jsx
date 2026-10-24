import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Check, X, Clock, Car, RefreshCw, AlertTriangle, User } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { visitorApi } from "@/services/api";
import { socketService } from "@/services/socket.service";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/visitor-approval")({
  head: () => ({
    meta: [
      { title: "Visitor Approvals – Harmony" },
      { name: "description", content: "Approve or deny gate visitors requesting entry to your flat." },
    ],
  }),
  component: VisitorApprovalPage,
});

function VisitorApprovalPage() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [actionId, setActionId] = useState(null);

  const fetchVisitors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await visitorApi.getAll({ status: activeTab });
      const list = res?.data?.visitors || res?.visitors || res?.data || [];
      setVisitors(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load visitors.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Socket listener for new incoming approval requests
  useEffect(() => {
    const handleApprovalRequest = () => {
      fetchVisitors();
      toast.info("New visitor arrival request at the gate!");
    };
    socketService.on("visitor:approval_requested", handleApprovalRequest);
    return () => {
      socketService.off("visitor:approval_requested", handleApprovalRequest);
    };
  }, [fetchVisitors]);

  const handleApprove = async (id, name) => {
    setActionId(id);
    try {
      await visitorApi.approve(id);
      toast.success(`${name || "Visitor"} approved! Security guard notified.`);
      fetchVisitors();
    } catch (err) {
      toast.error(err.message || "Failed to approve visitor.");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id, name) => {
    setActionId(id);
    try {
      await visitorApi.reject(id, "Entry denied by resident");
      toast.error(`${name || "Visitor"} rejected. Security guard notified.`);
      fetchVisitors();
    } catch (err) {
      toast.error(err.message || "Failed to reject visitor.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Visitor Approvals"
        description="Review gate requests and approve or deny visitors for your flat."
        actions={
          <Button variant="outline" size="sm" onClick={fetchVisitors} disabled={isLoading}>
            <RefreshCw className={`mr-1.5 size-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading && (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <RefreshCw className="size-5 animate-spin" />
              <span>Loading visitor requests…</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-xl">
              <AlertTriangle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchVisitors}>
                <RefreshCw className="mr-2 size-4" /> Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visitors.map((visitor) => {
                const vId = visitor.id || visitor._id;
                const vName = visitor.name || visitor.visitorName || "Guest";
                const isOperating = actionId === vId;

                return (
                  <SurfaceCard key={vId} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-foreground">{vName}</h3>
                        <Badge
                          variant={
                            visitor.approvalStatus === "Pending"
                              ? "outline"
                              : visitor.approvalStatus === "Approved"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {visitor.approvalStatus || visitor.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium text-foreground">Purpose:</span> {visitor.purpose || "Guest"}
                        </p>
                        <p className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          Logged: {visitor.createdAt ? new Date(visitor.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </p>
                        {visitor.vehicleNumber && (
                          <p className="flex items-center">
                            <Car className="h-3.5 w-3.5 mr-1.5" /> Vehicle: {visitor.vehicleNumber}
                          </p>
                        )}
                        {visitor.phone && (
                          <p className="text-xs text-muted-foreground">Phone: {visitor.phone}</p>
                        )}
                      </div>
                    </div>

                    {visitor.approvalStatus === "Pending" && (
                      <div className="flex sm:flex-col gap-2 shrink-0 self-start sm:self-center">
                        <Button
                          size="sm"
                          disabled={isOperating}
                          onClick={() => handleApprove(vId, vName)}
                          className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Check className="h-4 w-4 mr-1.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isOperating}
                          onClick={() => handleReject(vId, vName)}
                          className="w-full font-bold"
                        >
                          <X className="h-4 w-4 mr-1.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </SurfaceCard>
                );
              })}

              {visitors.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                  No {activeTab} visitors for your flat.
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
