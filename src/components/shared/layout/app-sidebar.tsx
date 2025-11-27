"use client";

import {
  Home,
  Sparkles,
  ChartBar,
  Settings,
  PenLine,
  History,
  Search,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/shared/ui/sidebar";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useCommand } from "@/components/shared/providers/command-provider";
import { useEffect, useState } from "react";
import { useThemeConfig } from "@/shared/hooks/use-theme-config";
import Image from "next/image";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Today's Entry",
    url: "/journal/today",
    icon: PenLine,
  },
  {
    title: "Journal History",
    url: "/journal",
    icon: History,
  },
  {
    title: "Nova AI",
    url: "/nova",
    icon: Sparkles,
  },
  {
    title: "Weekly Insights",
    url: "/insights",
    icon: ChartBar,
  },
  {
    title: "Settings",
    url: "/profile",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { toggle } = useCommand();
  const [isMac, setIsMac] = useState(false);
  const { logoSrc } = useThemeConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    setMounted(true);
  }, []);

  return (
    <Sidebar variant="floating" className="border-0">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              {mounted && (
                <Image
                  src={logoSrc}
                  alt="Nova Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
              )}
            </div>
            <span className="font-serif text-2xl font-semibold text-sidebar-foreground">Nova</span>
          </Link>
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-accent/50 text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title={`Search (${isMac ? '⌘' : 'Ctrl'}+K)`}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.url ||
                (item.url === "/journal/today" &&
                  pathname.startsWith("/journal/today")) ||
                (item.url === "/journal" &&
                  pathname.startsWith("/journal/") &&
                  pathname !== "/journal/today" &&
                  !pathname.startsWith("/journal/today"));

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "h-11 px-3 w-full rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent font-medium shadow-sm"
                        : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] transition-colors",
                          isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"
                        )}
                      />
                      <span className={cn(
                        "flex-1",
                        isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/80"
                      )}>
                        {item.title}
                      </span>
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-10 w-10 rounded-xl",
                userButtonPopoverCard: "shadow-xl pointer-events-auto rounded-xl",
              },
            }}
          />
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-medium truncate text-sidebar-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-sidebar-foreground/60 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
