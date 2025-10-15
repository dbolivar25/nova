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
import { motion } from "framer-motion";
import { useCommand } from "@/components/shared/providers/command-provider";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Detect if user is on Mac for proper keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    setMounted(true);
  }, []);

  return (
    <Sidebar variant="floating" className="border-0">
      <SidebarHeader className="border-b border-border/20 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-9 w-9 items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {mounted && (
                <Image
                  src={resolvedTheme === 'dark' ? '/nova-logo-dark-mode.svg' : '/nova-logo.svg'}
                  alt="Nova Logo"
                  width={36}
                  height={36}
                  className="h-9 w-9"
                />
              )}
            </motion.div>
            <span className="text-[26px] font-semibold leading-none text-primary">Nova</span>
          </div>
          <motion.button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/50 hover:bg-accent transition-colors mt-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={`Search (${isMac ? '⌘' : 'Ctrl'}+K)`}
          >
            <Search className="h-4 w-4" />
          </motion.button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.url ||
                (item.url === "/journal/today" &&
                  pathname.startsWith("/journal/today")) ||
                (item.url === "/journal" &&
                  pathname.startsWith("/journal/") &&
                  pathname !== "/journal/today");

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "h-11 px-3 w-full transition-all duration-200 rounded-xl",
                      isActive && "bg-accent shadow-sm font-medium",
                    )}
                  >
                    <Link href={item.url}>
                      <item.icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive && "text-primary",
                        )}
                      />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/20 p-3">
        <div className="flex items-center gap-3">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
                userButtonPopover: "prevent-mobile-sheet-close",
                userButtonPopoverCard: "shadow-xl prevent-mobile-sheet-close",
                userButtonPopoverFooter: "prevent-mobile-sheet-close",
              },
            }}
          />
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

