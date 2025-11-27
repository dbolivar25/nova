"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shared/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { themeList } from "@/shared/lib/theme/config"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {themeList.map((themeConfig) => (
          <DropdownMenuItem
            key={themeConfig.id}
            onClick={() => setTheme(themeConfig.id)}
            className="cursor-pointer"
          >
            <themeConfig.icon className="mr-2 h-4 w-4" />
            {themeConfig.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}