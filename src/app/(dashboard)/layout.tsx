"use client";

import { AppSidebar } from "@/components/shared/layout/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/shared/ui/sidebar";
import { Button } from "@/components/shared/ui/button";
import { PanelLeftIcon } from "lucide-react";
import { UserInitializer } from "@/components/shared/providers/user-initializer";
import { CommandProvider } from "@/components/shared/providers/command-provider";
import { NovaChatSidebarLayout } from "@/components/features/nova/nova-chat-sidebar-layout";
import { usePathname } from "next/navigation";

function DashboardContent({
  children,
  isNovaPage,
  toggleLeftSidebar,
}: {
  children: React.ReactNode;
  isNovaPage: boolean;
  toggleLeftSidebar: () => void;
}) {
  return (
    <>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 -ml-1"
            onClick={toggleLeftSidebar}
          >
            <PanelLeftIcon className="size-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <div className="flex-1" />
          {isNovaPage && <NovaChatSidebarLayout.RightTrigger className="-mr-1" />}
        </header>
        <main className="flex-1 flex flex-col">
          <div className={`flex-1 ${isNovaPage ? '' : 'p-6'}`}>{children}</div>
        </main>
      </SidebarInset>
      {isNovaPage && <NovaChatSidebarLayout.RightSidebar />}
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isNovaPage = pathname?.startsWith("/nova");

  return (
    <UserInitializer>
      <CommandProvider>
        <NovaChatSidebarLayout.GlobalProvider>
          <SidebarProvider>
            <AppSidebar />
            <NovaChatSidebarLayout.WithLeftToggle>
              {(toggleLeftSidebar) => (
                <NovaChatSidebarLayout.RightProvider isNovaPage={isNovaPage}>
                  <DashboardContent
                    isNovaPage={isNovaPage}
                    toggleLeftSidebar={toggleLeftSidebar}
                  >
                    {children}
                  </DashboardContent>
                </NovaChatSidebarLayout.RightProvider>
              )}
            </NovaChatSidebarLayout.WithLeftToggle>
          </SidebarProvider>
        </NovaChatSidebarLayout.GlobalProvider>
      </CommandProvider>
    </UserInitializer>
  );
}
