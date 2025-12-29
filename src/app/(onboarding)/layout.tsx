import { NovaLogo } from "@/components/shared/ui/nova-logo";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 w-full items-center justify-center">
          <NovaLogo className="h-8 w-8" />
          <span className="ml-2 font-serif text-xl font-semibold">Nova</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-3xl mx-auto py-8 flex items-start justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          Your responses are saved automatically and kept private.
        </div>
      </footer>
    </div>
  );
}
