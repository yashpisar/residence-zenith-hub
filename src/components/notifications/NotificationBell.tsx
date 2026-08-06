import { useState, useEffect } from "react";
import { Bell, Check, Trash2, ShieldAlert, MessageSquare, Wrench, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { socketService } from "@/services/socket.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export type NotificationType = "complaint" | "visitor" | "maintenance" | "emergency" | "notice";

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

const getIconForType = (type: NotificationType) => {
  switch (type) {
    case "complaint": return MessageSquare;
    case "visitor": return ShieldAlert;
    case "maintenance": return Wrench;
    case "emergency": return ShieldAlert;
    case "notice": return FileText;
    default: return Bell;
  }
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user } = useAuth();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;

    // Listen to real-time events based on role
    const handleVisitorRequest = (data: any) => {
      const newNotif: AppNotification = {
        id: data.id || Math.random().toString(),
        title: "Visitor Approval Request",
        detail: `New visitor: ${data.visitorName} wants to enter.`,
        type: "visitor",
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
      toast.info("New Visitor Request");
    };

    const handleComplaintStatus = (data: any) => {
      const newNotif: AppNotification = {
        id: Math.random().toString(),
        title: `Complaint ${data.status}`,
        detail: `Complaint #${data.id} is now ${data.status}`,
        type: "complaint",
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
      toast.info(`Complaint Updated to ${data.status}`);
    };

    // Subscriptions based on roles
    if (user.role === "resident") {
      socketService.on("visitor_approval_request", handleVisitorRequest);
      socketService.on("complaint_status_changed", handleComplaintStatus);
    } else if (user.role === "secretary") {
      socketService.on("new_complaint", handleComplaintStatus);
    } else if (user.role === "security") {
      socketService.on("visitor_approved", (data) => {
        toast.success(`Visitor ${data.visitorName} Approved!`);
      });
      socketService.on("visitor_rejected", (data) => {
        toast.error(`Visitor ${data.visitorName} Rejected!`);
      });
    }

    return () => {
      socketService.off("visitor_approval_request", handleVisitorRequest);
      socketService.off("complaint_status_changed", handleComplaintStatus);
      socketService.off("new_complaint", handleComplaintStatus);
      socketService.off("visitor_approved");
      socketService.off("visitor_rejected");
    };
  }, [user]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-surface">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4">
          <DropdownMenuLabel className="p-0 text-base">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-slim">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = getIconForType(n.type);
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "group flex gap-3 rounded-xl p-3 transition-colors hover:bg-muted",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      n.type === "visitor" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500" :
                      n.type === "complaint" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500" :
                      "bg-primary/10 text-primary"
                    )}>
                      <Icon className="size-5" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-semibold", !n.read && "text-foreground")}>{n.title}</p>
                        <span className="text-[10px] text-muted-foreground">Just now</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.detail}</p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!n.read && (
                        <Button variant="ghost" size="icon" className="size-6 text-primary" onClick={() => markAsRead(n.id)}>
                          <Check className="size-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={() => deleteNotification(n.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
