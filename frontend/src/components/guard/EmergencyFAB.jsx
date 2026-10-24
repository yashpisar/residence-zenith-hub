import { useState } from "react";
import {
  AlertTriangle,
  Flame,
  Stethoscope,
  ShieldAlert,
  Zap,
  ArrowUpToLine,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import { socketService } from "@/services/socket.service";
import { toast } from "sonner";

export function EmergencyFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const triggerEmergency = (type) => {
    socketService.emit("emergency", {
      type,
      location: "Main Gate",
      timestamp: new Date().toISOString(),
    });
    toast.error(`${type} Emergency Triggered! Secretary notified immediately.`, {
      style: { background: "var(--destructive)", color: "white", border: "none" },
    });
    setIsOpen(false);
  };

  const emergencies = [
    { label: "Fire", icon: Flame, color: "bg-orange-500", action: () => triggerEmergency("Fire") },
    {
      label: "Medical",
      icon: Stethoscope,
      color: "bg-blue-500",
      action: () => triggerEmergency("Medical"),
    },
    {
      label: "Theft",
      icon: ShieldAlert,
      color: "bg-slate-800 dark:bg-slate-600",
      action: () => triggerEmergency("Theft"),
    },
    {
      label: "Gas Leakage",
      icon: Zap,
      color: "bg-yellow-500",
      action: () => triggerEmergency("Gas Leakage"),
    },
    {
      label: "Lift Stuck",
      icon: ArrowUpToLine,
      color: "bg-purple-500",
      action: () => triggerEmergency("Lift Emergency"),
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col gap-2 mb-2"
          >
            {emergencies.map((e, idx) => (
              <motion.div
                key={e.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Button
                  onClick={e.action}
                  variant="outline"
                  className="flex items-center gap-3 rounded-full border-none shadow-lg bg-card hover:bg-muted py-6 px-4"
                >
                  <div className={`p-2 rounded-full text-white ${e.color}`}>
                    <e.icon className="size-4" />
                  </div>
                  <span className="font-semibold">{e.label}</span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={`size-14 rounded-full shadow-xl transition-all ${
          isOpen
            ? "bg-muted text-foreground hover:bg-muted"
            : "bg-destructive text-white hover:bg-destructive/90 hover:scale-105"
        }`}
      >
        {isOpen ? <X className="size-6" /> : <AlertTriangle className="size-7" />}
      </Button>
    </div>
  );
}
