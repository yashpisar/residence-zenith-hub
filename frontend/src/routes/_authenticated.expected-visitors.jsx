import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { CalendarClock, CheckCircle2, User, Phone, Building2, Car, Clock, RefreshCw, AlertTriangle, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { visitorApi } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expected-visitors")({
  head: () => ({
    meta: [
      { title: "Expected Visitors – Harmony" },
      { name: "description", content: "Pre-approved guests arriving today with gate check-in." },
    ],
  }),
  component: ExpectedVisitorsPage,
});

function formatDate(dateStr) {
  if (!dateStr) return "Today";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ExpectedVisitorsPage() {
  const [visitors, setVisitors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingInId, setCheckingInId] = useState(null);

  const fetchExpected = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await visitorApi.getExpected();
      const list = res?.data ?? res ?? [];
      setVisitors(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load expected visitors.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpected();
  }, [fetchExpected]);

  const handleCheckIn = async (visitor) => {
    const vId = visitor.id || visitor._id;
    setCheckingInId(vId);
    try {
      await visitorApi.recordEntry(vId);
      toast.success(`${visitor.visitorName || visitor.name} checked in successfully!`);
      setVisitors((prev) => prev.filter((v) => (v.id || v._id) !== vId));
    } catch (err) {
      toast.error(err.message || "Failed to check in visitor.");
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <>
      <PageHeader
        icon={CalendarClock}
        title="Expected Visitors"
        description="Pre-approved guests and service staff registered by residents, awaiting arrival."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchExpected} disabled={isLoading}>
              <RefreshCw className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" asChild>
              <Link to="/visitors/new">
                <UserPlus className="mr-1.5 size-4" /> New Visitor
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mt-6 space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <RefreshCw className="size-5 animate-spin" />
            <span>Loading expected guests…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-xl">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchExpected}>
              <RefreshCw className="mr-2 size-4" /> Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && visitors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-xl">
            <CalendarClock className="size-10 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No expected visitors right now</p>
            <p className="text-sm text-muted-foreground">
              When residents pre-approve guests or service staff, they will appear here for instant 1-click check-in.
            </p>
          </div>
        )}

        {!isLoading && !error && visitors.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visitors.map((v) => {
              const vId = v.id || v._id;
              const isCheckingIn = checkingInId === vId;

              return (
                <SurfaceCard key={vId} className="flex flex-col justify-between p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-foreground text-lg leading-tight">
                          {v.visitorName || v.name}
                        </h3>
                        <p className="text-xs text-primary font-medium mt-0.5">{v.purpose || "Guest"}</p>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                        Pre-Approved
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-primary" />
                        <span className="font-semibold text-foreground">
                          Flat {v.flat || `${v.wing || ""}-${v.flatNumber || ""}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5" />
                        <span>{v.phone || "No phone provided"}</span>
                      </div>
                      {v.vehicleNumber && (
                        <div className="flex items-center gap-2">
                          <Car className="size-3.5" />
                          <span>Vehicle: {v.vehicleNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5" />
                        <span>Expected: {formatDate(v.expectedTime)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleCheckIn(v)}
                    disabled={isCheckingIn}
                    className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  >
                    {isCheckingIn ? (
                      <>
                        <RefreshCw className="mr-2 size-4 animate-spin" /> Checking in…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" /> 1-Click Check In
                      </>
                    )}
                  </Button>
                </SurfaceCard>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
