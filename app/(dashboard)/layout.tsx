"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { UserInitializer } from "@/components/providers/user-initializer";
import { CommandProvider } from "@/components/providers/command-provider";
import { NovaChatSidebarLayout } from "@/components/nova/nova-chat-sidebar-layout";
import { usePathname } from "next/navigation";

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
            <NovaChatSidebarLayout.InsetWrapper isNovaPage={isNovaPage}>
              <SidebarInset>
                <header className="sticky top-0 z-40 flex h-14 items-center gap-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1" />
                  {isNovaPage && <NovaChatSidebarLayout.Trigger className="-mr-1" />}
                </header>
                <main className="flex-1 flex flex-col">
                  <div className="flex-1 p-6">{children}</div>
                </main>
              </SidebarInset>
            </NovaChatSidebarLayout.InsetWrapper>
          </SidebarProvider>
          {isNovaPage && <NovaChatSidebarLayout.Sidebar />}
        </NovaChatSidebarLayout.GlobalProvider>
      </CommandProvider>
    </UserInitializer>
  );
}

