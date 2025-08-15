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
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCommand } from "@/components/providers/command-provider";
import { useEffect, useState } from "react";

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

  // Detect if user is on Mac for proper keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  return (
    <Sidebar variant="floating" className="border-0">
      <SidebarHeader className="border-b border-border/20 px-4 py-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Nova</span>
            <span className="text-xs text-muted-foreground">AI Journal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {/* Search Button */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggle}
                className={cn(
                  "h-11 px-3 w-full transition-all duration-200 rounded-xl",
                  "bg-accent/50 hover:bg-accent shadow-sm",
                  "group"
                )}
              >
                <Search className="h-4 w-4 transition-colors group-hover:text-primary" />
                <span className="flex-1">Search</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">{isMac ? "⌘" : "Ctrl"}</span>K
                </kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarSeparator className="my-2" />
            
            {navItems.map((item) => {
              const isActive =
                pathname === item.url ||
                (item.url === "/journal/today" &&
                  pathname.startsWith("/journal/today"));

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
                userButtonPopoverCard: "shadow-xl",
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

