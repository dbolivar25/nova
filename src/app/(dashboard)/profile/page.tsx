"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Label } from "@/components/shared/ui/label"
import { Switch } from "@/components/shared/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/ui/select"
import { Skeleton } from "@/components/shared/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shared/ui/dropdown-menu"
import { useUser } from "@clerk/nextjs"
import { Download, Shield, Bell, Hash, Clock, FileJson, FileText, Palette } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/layout/page-header"
import { useUserPreferences } from "@/features/user/hooks/use-preferences"
import { useTheme } from "next-themes"

export default function ProfilePage() {
  const { user } = useUser()
  const { preferences, isLoading, updatePreferences } = useUserPreferences()
  const [isExporting, setIsExporting] = useState(false)
  const { theme, setTheme } = useTheme()

  const handleExportData = async (format: 'json' | 'csv') => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/user/export?format=${format}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `nova-export.${format}`

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Data exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePreferenceChange = async (key: string, value: boolean | string | number) => {
    try {
      await updatePreferences({ [key]: value })
    } catch (error) {
      console.error(`Failed to update ${key}:`, error)
    }
  }

  // Format time for display
  const formatTimeDisplay = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Profile Settings"
        subtitle="Manage your account and preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <div>
            <Label>Member Since</Label>
            <p className="text-sm text-muted-foreground">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Data</CardTitle>
          <CardDescription>Control your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <Label>End-to-End Encryption</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Your journal entries are encrypted
              </p>
            </div>
            <Switch checked disabled />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <Label>Data Export</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Download all your data at any time
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isExporting}
                  className="min-w-[130px]"
                >
                  {isExporting ? (
                    <>
                      <div className="h-3 w-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  onClick={() => handleExportData('json')}
                  className="cursor-pointer"
                  disabled={isExporting}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <FileJson className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="font-medium">JSON Format</div>
                        <div className="text-xs text-muted-foreground">Complete data export</div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExportData('csv')}
                  className="cursor-pointer"
                  disabled={isExporting}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="font-medium">CSV Format</div>
                        <div className="text-xs text-muted-foreground">Journal entries only</div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your Nova experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <Label htmlFor="appearance">Appearance</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
                <Select
                  value={theme}
                  onValueChange={setTheme}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="daily-reminder">Daily Reminders</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to journal each day
                  </p>
                </div>
                <Switch
                  id="daily-reminder"
                  checked={preferences?.daily_reminder_enabled || false}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("daily_reminder_enabled", checked)
                  }
                />
              </div>

              {preferences?.daily_reminder_enabled && (
                <div className="flex items-center justify-between pl-6">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <Label htmlFor="reminder-time">Reminder Time</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When to send daily reminders
                    </p>
                  </div>
                  <Select
                    value={preferences?.reminder_time || "09:00:00"}
                    onValueChange={(value) => 
                      handlePreferenceChange("reminder_time", value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        {formatTimeDisplay(preferences?.reminder_time || "09:00:00")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="07:00:00">7:00 AM</SelectItem>
                      <SelectItem value="08:00:00">8:00 AM</SelectItem>
                      <SelectItem value="09:00:00">9:00 AM</SelectItem>
                      <SelectItem value="10:00:00">10:00 AM</SelectItem>
                      <SelectItem value="12:00:00">12:00 PM</SelectItem>
                      <SelectItem value="14:00:00">2:00 PM</SelectItem>
                      <SelectItem value="18:00:00">6:00 PM</SelectItem>
                      <SelectItem value="20:00:00">8:00 PM</SelectItem>
                      <SelectItem value="21:00:00">9:00 PM</SelectItem>
                      <SelectItem value="22:00:00">10:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <Label htmlFor="prompt-count">Daily Prompts</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Number of prompts per day (1-5)
                  </p>
                </div>
                <Select
                  value={String(preferences?.prompt_count || 3)}
                  onValueChange={(value) => 
                    handlePreferenceChange("prompt_count", parseInt(value))
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  )
}