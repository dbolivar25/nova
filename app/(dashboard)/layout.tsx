import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserInitializer } from "@/components/providers/user-initializer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserInitializer>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <ThemeToggle />
          </header>
          <main className="flex-1 flex flex-col">
            <div className="flex-1 p-6">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserInitializer>
  );
}

