import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, PenLine, Brain, Shield } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();
  
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Nova</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Your AI-Powered
              <span className="block text-primary">Personal Journal</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nova is your intelligent companion for self-reflection, personal growth, 
              and meaningful insights. Journal your thoughts and receive personalized 
              guidance from an AI that understands you.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">Start Journaling Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>

          <div id="features" className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="bg-card p-8 rounded-lg shadow-sm">
              <div className="mb-4">
                <PenLine className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Guided Journaling</h3>
              <p className="text-muted-foreground">
                Daily prompts designed to unlock deep reflection and self-awareness. 
                Write at your own pace with questions that matter.
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-sm">
              <div className="mb-4">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Insights</h3>
              <p className="text-muted-foreground">
                Nova learns from your entries to provide personalized insights, 
                helping you understand patterns and grow.
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-sm">
              <div className="mb-4">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Private & Secure</h3>
              <p className="text-muted-foreground">
                Your thoughts are sacred. All entries are encrypted and private. 
                You have complete control over your data.
              </p>
            </div>
          </div>

          <div className="text-center mt-20 pb-8">
            <h2 className="text-3xl font-semibold mb-4">
              Begin Your Journey of Self-Discovery
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands who have found clarity, purpose, and growth through 
              daily reflection with Nova.
            </p>
            <Button size="lg" asChild>
              <Link href="/sign-up">Create Your Free Account</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
