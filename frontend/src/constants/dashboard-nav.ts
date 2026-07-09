import {
  LayoutDashboard,
  UploadCloud,
  MessageSquareText,
  BarChart3,
  FileText,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Features shipping in a later phase — shown but not yet clickable. */
  comingSoon?: boolean;
}

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload File", href: "/dashboard/upload", icon: UploadCloud },
  { label: "AI Chat", href: "/dashboard/chat", icon: MessageSquareText },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
];

export const DASHBOARD_NAV_FOOTER: DashboardNavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];
