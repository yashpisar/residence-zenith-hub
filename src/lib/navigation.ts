import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  Gauge,
  HardHat,
  History,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  MessageSquarePlus,
  MessagesSquare,
  Package,
  QrCode,
  Receipt,
  Settings,
  ShieldCheck,
  UserCircle,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import type { Role } from "./app-context";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV: Record<Role, NavGroup[]> = {
  resident: [
    {
      label: "Overview",
      items: [{ label: "Dashboard", to: "/resident/dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Complaints",
      items: [
        { label: "Register Complaint", to: "/complaints/new", icon: MessageSquarePlus },
        { label: "My Complaints", to: "/complaints", icon: MessagesSquare, badge: 3 },
        { label: "Public Complaints", to: "/public-complaints", icon: Users },
      ],
    },
    {
      label: "Society",
      items: [
        { label: "Maintenance", to: "/maintenance", icon: Wrench },
        { label: "Payment History", to: "/payments", icon: Receipt },
        { label: "Visitor Approval", to: "/visitor-approval", icon: ShieldCheck, badge: 2 },
        { label: "Notices", to: "/notices", icon: Bell, badge: 5 },
        { label: "Documents", to: "/documents", icon: FileText },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Profile", to: "/profile", icon: UserCircle },
        { label: "Settings", to: "/settings", icon: Settings },
      ],
    },
  ],
  secretary: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", to: "/secretary/dashboard", icon: LayoutDashboard },
        { label: "Analytics", to: "/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Complaints", to: "/complaints", icon: MessagesSquare, badge: 12 },
        { label: "Maintenance", to: "/maintenance", icon: Wrench },
        { label: "Payments", to: "/payments", icon: CreditCard },
        { label: "Visitor Reports", to: "/visitor-reports", icon: History },
      ],
    },
    {
      label: "Community",
      items: [
        { label: "Residents", to: "/residents", icon: Users },
        { label: "Flats", to: "/flats", icon: Building2 },
        { label: "Staff", to: "/staff", icon: HardHat },
        { label: "Announcements", to: "/announcements", icon: Megaphone },
        { label: "Documents", to: "/documents", icon: FileText },
      ],
    },
    {
      label: "Account",
      items: [{ label: "Settings", to: "/settings", icon: Settings }],
    },
  ],
  security: [
    {
      label: "Overview",
      items: [{ label: "Dashboard", to: "/guard/dashboard", icon: Gauge }],
    },
    {
      label: "Gate",
      items: [
        { label: "New Visitor", to: "/visitors/new", icon: UserPlus },
        { label: "Visitor History", to: "/visitors/history", icon: History },
        { label: "QR Scanner", to: "/qr-scanner", icon: QrCode },
        { label: "Deliveries", to: "/deliveries", icon: Package, badge: 4 },
        { label: "Expected Visitors", to: "/expected-visitors", icon: CalendarClock },
        { label: "Emergency", to: "/emergency", icon: AlertTriangle },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Profile", to: "/profile", icon: UserCircle },
        { label: "Settings", to: "/settings", icon: Settings },
      ],
    },
  ],
  superadmin: [
    {
      label: "Overview",
      items: [{ label: "Dashboard", to: "/superadmin/dashboard", icon: LayoutDashboard }],
    },
    {
      label: "System",
      items: [
        { label: "Global Settings", to: "/settings", icon: Settings },
      ],
    }
  ]
};
