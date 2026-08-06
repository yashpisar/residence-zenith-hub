import { useState } from "react";
import {
  Bell,
  Building2,
  Command,
  Laptop,
  Menu,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Sun,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarContentInner } from "./Sidebar";
import { ROLE_LABEL, useApp, type Role, type ThemeMode } from "@/lib/app-context";
import { toast } from "sonner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/common/GlobalSearch";

const themeIcon: Record<ThemeMode, typeof Sun> = { dark: Moon, light: Sun, system: Laptop };

export function Topbar() {
  const { role, setRole, theme, setTheme, sidebarCollapsed, toggleSidebar } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ThemeIcon = themeIcon[theme];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-xl md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContentInner onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {sidebarCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
          className="hidden lg:inline-flex"
        >
          <PanelLeft />
        </Button>
      )}

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Button
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => toast.success("Quick action opened")}
        >
          <Plus /> Quick action
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Switch role">
              <UserCircle />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={role} onValueChange={(v) => setRole(v as Role)}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <DropdownMenuRadioItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                localStorage.removeItem("havenly.token");
                localStorage.removeItem("havenly.user");
                localStorage.removeItem("havenly.societyId");
                window.location.href = "/select-society";
              }}
            >
              <Building2 className="mr-2 size-4" /> Switch Society
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => {
                localStorage.removeItem("havenly.token");
                localStorage.removeItem("havenly.user");
                window.location.href = "/login";
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Toggle theme">
              <ThemeIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemeMode)}>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
