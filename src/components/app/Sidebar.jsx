import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Building2, ChevronsLeft, LogOut } from "lucide-react";
import { NAV } from "@/lib/navigation";
import { ROLE_LABEL, useApp } from "@/lib/app-context";
import { useSociety } from "@/contexts/SocietyContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export function SidebarContentInner({ onNavigate }) {
  const { role, sidebarCollapsed, toggleSidebar } = useApp();
  const { user, logout } = useAuth();
  const { selectedSociety } = useSociety();
  const collapsed = sidebarCollapsed && !onNavigate;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const activeRole = user?.role || role || "resident";

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        {selectedSociety?.logo ? (
          <img
            src={selectedSociety.logo}
            alt="logo"
            className="size-10 shrink-0 rounded-xl object-cover border border-sidebar-border"
          />
        ) : (
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Building2 className="size-5 text-primary-foreground" />
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight text-foreground">
              {selectedSociety?.name || "Society OS"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {selectedSociety?.city || "Global Control"}
            </p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="hidden size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground lg:grid"
          >
            <ChevronsLeft className="size-4" />
          </button>
        )}
      </div>

      <nav className="scrollbar-slim flex-1 overflow-y-auto px-3 py-4">
        {NAV[activeRole]?.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                        />
                      )}
                      <item.icon
                        className={cn(
                          "size-5 shrink-0 transition-colors",
                          active
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-primary",
                        )}
                      />

                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.badge ? (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3",
            collapsed && "justify-center p-2",
          )}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="size-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-xs font-bold text-primary-foreground">
              {getInitials(user?.name)}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.name || "Guest"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role ? ROLE_LABEL[user.role] || user.role : "Unknown Role"}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              aria-label="Sign out"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
