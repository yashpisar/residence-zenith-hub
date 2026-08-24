import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QrCode, ScanLine, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { socketService } from "@/services/socket.service";

export const Route = createFileRoute("/_authenticated/qr-scanner")({
  component: QRScanner,
});

function QRScanner() {
  const [scanState, setScanState] = useState("idle");
  const [visitorData, setVisitorData] = useState(null);

  const startScan = () => {
    setScanState("scanning");
    // Simulate scanner delay and mock a scan result
    setTimeout(() => {
      const mockOutcomes = ["valid", "invalid", "expired"];
      // Weighted towards valid for demonstration
      const outcome =
        mockOutcomes[Math.random() > 0.3 ? 0 : Math.floor(Math.random() * mockOutcomes.length)];
      if (outcome === "valid") {
        setVisitorData({
          id: `VIS-${Math.floor(Math.random() * 900) + 100}`,
          name: "Amit Shukla",
          flat: "A-302",
          purpose: "Guest",
          validUntil: "23:59",
        });
        toast.success("Valid QR Pass Scanned");
      } else if (outcome === "expired") {
        toast.warning("QR Pass Expired");
      } else {
        toast.error("Invalid QR Code");
      }
      setScanState(outcome);
    }, 2000);
  };

  const handleCheckIn = () => {
    if (visitorData) {
      socketService.emit("visitor_checked_in", visitorData);
      toast.success("Visitor Checked In successfully!");
      setScanState("idle");
      setVisitorData(null);
    }
  };

  return (
    <>
      <PageHeader
        icon={QrCode}
        title="QR Scanner"
        description="Scan and verify digital visitor passes."
      />

      <div className="mt-6 max-w-xl mx-auto">
        <SurfaceCard className="overflow-hidden">
          <div className="p-8 flex flex-col items-center min-h-[400px]">
            <AnimatePresence mode="wait">
              {scanState === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center flex-1 w-full text-center"
                >
                  <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <QrCode className="size-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Ready to Scan</h3>
                  <p className="text-muted-foreground mb-8">
                    Position the visitor's QR code in front of the camera to verify their pass.
                  </p>
                  <Button
                    size="lg"
                    onClick={startScan}
                    className="w-full max-w-xs rounded-full shadow-lg h-14 text-lg"
                  >
                    <ScanLine className="mr-2" /> Start Scanner
                  </Button>
                </motion.div>
              )}

              {scanState === "scanning" && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center flex-1 w-full"
                >
                  <div className="relative size-64 border-2 border-primary rounded-xl overflow-hidden mb-6 flex items-center justify-center bg-black">
                    <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)]"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />

                    <ScanLine className="size-16 text-primary/50" />
                  </div>
                  <p className="animate-pulse font-medium text-lg">Scanning...</p>
                </motion.div>
              )}

              {scanState === "valid" && visitorData && (
                <motion.div
                  key="valid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center flex-1 w-full"
                >
                  <div className="size-20 rounded-full bg-success/20 flex items-center justify-center mb-4 text-success">
                    <CheckCircle2 className="size-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-success mb-1">Pass Valid!</h3>
                  <p className="text-muted-foreground mb-6">QR code verified successfully.</p>

                  <div className="w-full bg-muted/30 rounded-xl p-5 mb-8 border border-border">
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                      <div>
                        <p className="text-muted-foreground uppercase text-xs font-semibold">
                          Name
                        </p>
                        <p className="font-bold text-lg">{visitorData.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-xs font-semibold">
                          Flat
                        </p>
                        <p className="font-bold text-lg">{visitorData.flat}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-xs font-semibold">
                          Purpose
                        </p>
                        <p className="font-medium">{visitorData.purpose}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-xs font-semibold">
                          Valid Until
                        </p>
                        <p className="font-medium">{visitorData.validUntil}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 w-full">
                    <Button
                      variant="outline"
                      onClick={() => setScanState("idle")}
                      className="flex-1 h-12"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCheckIn}
                      className="flex-1 h-12 bg-success hover:bg-success/90"
                    >
                      Allow Entry
                    </Button>
                  </div>
                </motion.div>
              )}

              {scanState === "invalid" && (
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center flex-1 w-full text-center"
                >
                  <div className="size-24 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
                    <XCircle className="size-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-destructive mb-2">Invalid QR Code</h3>
                  <p className="text-muted-foreground mb-8 max-w-sm">
                    This QR code is not recognized by the system or might belong to a different
                    society.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => setScanState("idle")}
                    variant="outline"
                    className="w-full max-w-xs h-14"
                  >
                    Scan Again
                  </Button>
                </motion.div>
              )}

              {scanState === "expired" && (
                <motion.div
                  key="expired"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center flex-1 w-full text-center"
                >
                  <div className="size-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500">
                    <AlertTriangle className="size-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-amber-500 mb-2">Pass Expired</h3>
                  <p className="text-muted-foreground mb-8 max-w-sm">
                    This visitor pass has exceeded its expected exit time or is from a past date. A
                    new approval is required.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => setScanState("idle")}
                    variant="outline"
                    className="w-full max-w-xs h-14"
                  >
                    Scan Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}
