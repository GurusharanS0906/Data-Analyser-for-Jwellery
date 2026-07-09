import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { TopbarSearch } from "@/components/dashboard/topbar-search";
import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ModeToggle } from "@/components/shared/mode-toggle";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <MobileSidebar />
      <TopbarSearch />
      <div className="ml-auto flex items-center gap-1">
        <ModeToggle />
        <NotificationsDropdown />
        <div className="ml-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
