import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PenLine, Brain, Shield } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  siteDescription,
  siteName,
  siteOgImage,
  siteUrl,
} from "@/shared/lib/site-metadata";

export const metadata: Metadata = {
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    url: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  image: siteOgImage,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  potentialAction: {
    "@type": "RegisterAction",
    target: `${siteUrl}/sign-up`,
  },
} as const;

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: siteUrl,
  name: siteName,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={query}`,
    "query-input": "required name=query",
  },
} as const;

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <script
        id="nova-homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webApplicationJsonLd, websiteJsonLd]),
        }}
      />
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9">
              <Image
                src="/nova-logo.svg"
                alt="Nova Logo"
                fill
                className="block dark:hidden"
                sizes="36px"
                priority
              />
              <Image
                src="/nova-logo-dark-mode.svg"
                alt="Nova Logo"
                fill
                className="hidden dark:block"
                sizes="36px"
                priority
              />
            </div>
            <span className="text-[26px] font-semibold leading-none text-primary">
              Nova
            </span>
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
              Nova is your intelligent companion for self-reflection, personal
              growth, and meaningful insights. Journal your thoughts and receive
              personalized guidance from an AI that understands you.
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
                Daily prompts designed to unlock deep reflection and
                self-awareness. Write at your own pace with questions that
                matter.
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
              <h3 className="text-xl font-semibold mb-2">Private &amp; Secure</h3>
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
