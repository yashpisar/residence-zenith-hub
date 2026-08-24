import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, Share2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "motion/react";

export function VisitorPass({ visitor, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Pass downloaded successfully.");
  };

  const passData = JSON.stringify({
    id: visitor.id,
    name: visitor.visitorName,
    flat: `${visitor.wing}-${visitor.flatNumber}`,
    purpose: visitor.purpose,
    validUntil: visitor.expectedExitTime || "23:59",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm mx-auto bg-card rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col"
    >
      <div className="bg-success text-white p-4 text-center relative">
        <CheckCircle2 className="size-12 mx-auto mb-2 opacity-90" />
        <h2 className="text-xl font-bold uppercase tracking-widest">Entry Pass</h2>
        <p className="text-success-foreground text-xs mt-1 font-medium bg-white/20 inline-block px-2 py-0.5 rounded-full">
          Approved
        </p>
      </div>

      <div className="p-6 flex flex-col items-center bg-card">
        {/* Photo */}
        <div className="h-24 w-24 rounded-full border-4 border-muted overflow-hidden bg-muted mb-4 shadow-md -mt-12 relative z-10 bg-card">
          {visitor.visitorPhoto ? (
            <img
              src={visitor.visitorPhoto}
              alt={visitor.visitorName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-3xl font-bold">
              {visitor.visitorName.charAt(0)}
            </div>
          )}
        </div>

        <h3 className="text-2xl font-bold text-foreground text-center">{visitor.visitorName}</h3>
        <p className="text-sm font-medium text-primary mt-1">{visitor.purpose}</p>

        <div className="w-full grid grid-cols-2 gap-y-4 gap-x-2 mt-6 p-4 bg-muted/30 rounded-xl text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Flat
            </p>
            <p className="font-bold text-foreground">
              {visitor.wing} - {visitor.flatNumber}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Host
            </p>
            <p className="font-bold text-foreground truncate">
              {visitor.residentName || "Resident"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Entry Time
            </p>
            <p className="font-bold text-foreground">{visitor.entryTime}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Valid Until
            </p>
            <p className="font-bold text-foreground">{visitor.expectedExitTime || "End of Day"}</p>
          </div>
          {visitor.vehicleNumber && (
            <div className="col-span-2 border-t border-border/50 pt-2 mt-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Vehicle
              </p>
              <p className="font-bold text-foreground">{visitor.vehicleNumber}</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-2 bg-white rounded-xl shadow-inner border border-gray-100">
          <QRCodeSVG value={passData} size={140} level="H" includeMargin={false} />
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-mono">ID: {visitor.id}</p>
      </div>

      <div className="p-4 bg-muted/10 border-t border-border grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex flex-col h-auto py-2 gap-1 text-xs"
          onClick={handlePrint}
        >
          <Printer className="size-4" /> Print
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex flex-col h-auto py-2 gap-1 text-xs"
          onClick={handleDownload}
        >
          <Download className="size-4" /> Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex flex-col h-auto py-2 gap-1 text-xs"
          onClick={onClose}
        >
          <Share2 className="size-4" /> Share
        </Button>
      </div>
      <div className="p-4 pt-0">
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    </motion.div>
  );
}
