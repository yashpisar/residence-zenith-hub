import { useState } from "react";
import {
  Bell,
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
import { activityFeed } from "@/lib/mock-data";
import { toast } from "sonner";

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

      <label className="relative hidden min-w-0 flex-1 items-center md:flex md:max-w-md">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search complaints, residents, flats…"
          className="h-10 w-full rounded-xl border border-border bg-background/60 pl-9 pr-16 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
        />
        <kbd className="pointer-events-none absolute right-3 flex items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          <Command className="size-3" />K
        </kbd>
      </label>

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
            <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-surface" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Live notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activityFeed.slice(0, 4).map((a) => (
              <DropdownMenuItem key={a.id} className="flex-col items-start gap-0.5 py-2.5">
                <span className="text-sm font-semibold text-foreground">{a.title}</span>
                <span className="text-xs text-muted-foreground">{a.detail}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
