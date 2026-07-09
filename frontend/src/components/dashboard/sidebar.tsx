"use client";

import * as React from "react";
import Link from "next/link";
import { Gem, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { cn } from "@/lib/utils";

const COLLAPSE_STORAGE_KEY = "jewelai:sidebar-collapsed";

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-64",
        !mounted && "invisible"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-white/5 px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-foreground/20 bg-gradient-to-br from-gold-light/20 to-gold-dark/20">
            <Gem className="size-4 text-foreground" strokeWidth={1.75} />
          </span>
          {!collapsed && (
            <span className="truncate font-heading text-base font-semibold">
              Jewellery<span className="text-foreground">AI</span>
            </span>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className={cn("border-t border-white/5 p-3", collapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={toggle}
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="size-[18px]" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
