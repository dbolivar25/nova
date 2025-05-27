"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@clerk/nextjs"
import { Download, Shield, Bell, Moon } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function ProfilePage() {
  const { user } = useUser()

  const handleExportData = () => {
    toast.success("Export feature coming soon!")
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

          <Button onClick={handleExportData} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export All Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your Nova experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label>Daily Reminders</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Get reminded to journal each day
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <Label>Auto Dark Mode</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically switch theme at night
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}