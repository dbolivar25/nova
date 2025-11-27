"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/shared/ui/button"
import {
  Clock3,
  MoonIcon,
  SunIcon,
  PenLine,
  Calendar,
  MessageCircle,
  ChartBar,
  User,
  Sunset,
  Monitor,
} from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shared/ui/dropdown-menu"
import { ThemePreference } from "@/shared/lib/theme-preferences"
import { useThemePreference } from "@/shared/hooks/use-theme-preference"

const navigation = [
  { name: "Today", href: "/dashboard", icon: PenLine },
  { name: "Journal", href: "/journal", icon: Calendar },
  { name: "Nova", href: "/nova", icon: MessageCircle },
  { name: "Insights", href: "/insights", icon: ChartBar },
  { name: "Profile", href: "/profile", icon: User },
]

export function NavHeader() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const { setPreference: setThemePreference } = useThemePreference()

  const handleThemeChange = (preference: ThemePreference) => {
    setThemePreference(preference)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative h-6 w-6">
                <Image
                  src={resolvedTheme === 'dark' ? '/nova-logo-dark-mode.svg' : '/nova-logo.svg'}
                  alt="Nova"
                  fill
                  sizes="24px"
                />
              </div>
              <span className="font-serif text-xl font-semibold">Nova</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === item.href
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                  <SunIcon className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("sunset")}>
                  <Sunset className="mr-2 h-4 w-4" />
                  Sunset
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                  <MoonIcon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("time")}>
                  <Clock3 className="mr-2 h-4 w-4" />
                  Time of Day
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
