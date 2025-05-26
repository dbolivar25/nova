import { NavHeader } from "@/components/layout/nav-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}