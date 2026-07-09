"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { DASHBOARD_NAV, DASHBOARD_NAV_FOOTER, type DashboardNavItem } from "@/constants/dashboard-nav";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: DashboardNavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const content = (
    <span
      className={cn(
        "group/nav flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        collapsed && "justify-center px-2",
        item.comingSoon
          ? "cursor-default text-sidebar-foreground/35"
          : active
            ? "bg-foreground/5 text-foreground"
            : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
      )}
    >
      <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.comingSoon && (
        <Badge variant="outline" className="border-white/10 text-[10px] text-sidebar-foreground/40">
          Soon
        </Badge>
      )}
    </span>
  );

  const inner = item.comingSoon ? (
    <div aria-disabled>{content}</div>
  ) : (
    <Link href={item.href} onClick={onNavigate}>
      {content}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">
          {item.label}
          {item.comingSoon ? " (coming soon)" : ""}
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col justify-between">
      <nav className="flex flex-col gap-1 px-3">
        {DASHBOARD_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <nav className="flex flex-col gap-1 border-t border-white/5 px-3 pt-3">
        {DASHBOARD_NAV_FOOTER.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}
