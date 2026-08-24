import { useState } from "react";
import { Building2, Laptop, Menu, Moon, PanelLeft, Plus, Sun, UserCircle } from "lucide-react";
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
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/contexts/AuthContext";
import { useSociety } from "@/contexts/SocietyContext";
import { toast } from "sonner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/common/GlobalSearch";

const themeIcon = { dark: Moon, light: Sun, system: Laptop };

export function Topbar() {
  const { role, setRole, theme, setTheme, sidebarCollapsed, toggleSidebar } = useApp();
  const { user, logout } = useAuth();
  const { selectedSociety } = useSociety();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ThemeIcon = themeIcon[theme];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-xl md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" aria-label="Open navigation">
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
          className="hidden lg:inline-flex shrink-0"
        >
          <PanelLeft />
        </Button>
      )}

      {selectedSociety && (
        <div className="flex items-center gap-2 max-w-[150px] sm:max-w-[200px] md:max-w-[300px] lg:hidden">
          <img src={selectedSociety.logo} alt="Logo" className="size-6 rounded-full object-cover shrink-0 hidden sm:block" />
          <span className="font-semibold text-sm truncate">{selectedSociety.name}</span>
        </div>
      )}

      <div className="hidden lg:block flex-1 max-w-md">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
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
            <DropdownMenuLabel className="flex flex-col">
              <span>{user?.name || "Guest"}</span>
              <span className="text-xs font-normal text-muted-foreground capitalize">
                {user?.role || "Resident"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                window.location.href = "/select-society";
              }}
            >
              <Building2 className="mr-2 size-4" /> Switch Society
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => logout()}>
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
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v)}>
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
