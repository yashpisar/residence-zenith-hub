import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { SidebarContentInner } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

export function AppShell({ children }) {
  const { sidebarCollapsed } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border transition-[width] duration-300 ease-out lg:block",
          sidebarCollapsed ? "w-[76px]" : "w-[268px]",
        )}
      >
        <SidebarContentInner />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[1400px]"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
