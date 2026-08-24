import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { Search, UserCircle, MessageSquare, Wrench, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path) => {
    setOpen(false);
    navigate({ to: path });
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative hidden min-w-0 flex-1 items-center md:flex md:max-w-md cursor-text text-left"
      >
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <div className="flex h-10 w-full items-center rounded-xl border border-border bg-background/60 pl-9 pr-16 text-sm text-muted-foreground transition-all hover:border-primary/60 hover:ring-2 hover:ring-primary/25">
          {user.role === "resident" && "Search complaints, notices..."}
          {user.role === "secretary" && "Search residents, flats, staff..."}
          {user.role === "security" && "Search visitors, deliveries, QR..."}
        </div>
        <kbd className="pointer-events-none absolute right-3 flex items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          <Command className="size-3" />K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-2xl bg-card border-border shadow-2xl rounded-2xl">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <Command className="flex flex-col w-full h-[400px]">
            <div className="flex items-center px-4 border-b border-border">
              <Search className="size-5 text-muted-foreground shrink-0" />
              <Command.Input
                autoFocus
                placeholder="Type a command or search..."
                className="flex h-14 w-full bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-foreground"
              />
            </div>

            <Command.List className="overflow-y-auto p-2 scrollbar-slim">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              {user.role === "resident" && (
                <Command.Group
                  heading="Resident Actions"
                  className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <Command.Item
                    onSelect={() => handleSelect("/complaints/new")}
                    className="flex items-center gap-2 px-2 py-3 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted text-sm text-foreground"
                  >
                    <MessageSquare className="size-4 text-primary" /> Register Complaint
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect("/maintenance")}
                    className="flex items-center gap-2 px-2 py-3 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted text-sm text-foreground"
                  >
                    <Wrench className="size-4 text-primary" /> Pay Maintenance
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect("/visitor-approval")}
                    className="flex items-center gap-2 px-2 py-3 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted text-sm text-foreground"
                  >
                    <ShieldAlert className="size-4 text-primary" /> Pre-approve Visitor
                  </Command.Item>
                </Command.Group>
              )}

              {user.role === "secretary" && (
                <Command.Group
                  heading="Admin Actions"
                  className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <Command.Item
                    onSelect={() => handleSelect("/residents")}
                    className="flex items-center gap-2 px-2 py-3 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted text-sm text-foreground"
                  >
                    <UserCircle className="size-4 text-primary" /> Manage Residents
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect("/complaints")}
                    className="flex items-center gap-2 px-2 py-3 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted text-sm text-foreground"
                  >
                    <MessageSquare className="size-4 text-primary" /> View Complaints
                  </Command.Item>
                </Command.Group>
              )}

              {user.role === "security" && (
                <Command.Group
                  heading="Security Actions"
                  className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <Command.Item
                    onSelect={() => handleSelect("/visitors/new")}
                    className="flex items-center gap-2 px-2 py-3 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted text-sm text-foreground"
                  >
                    <UserCircle className="size-4 text-primary" /> Register New Visitor
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect("/qr-scanner")}
                    className="flex items-center gap-2 px-2 py-3 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted text-sm text-foreground"
                  >
                    <ShieldAlert className="size-4 text-primary" /> Scan QR Pass
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
