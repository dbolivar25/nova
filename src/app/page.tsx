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

const testimonials = [
  {
    name: "Amelia R.",
    role: "Therapist and evening journaler",
    quote:
      "Nova keeps my nightly reflection light enough to do, yet meaningful enough to matter. It is the first tool that has actually stuck.",
  },
  {
    name: "Noah P.",
    role: "Product designer and new dad",
    quote:
      "The prompts meet me where I am. Some days it is two lines, other days I write more, but I always leave with a calmer mind.",
  },
] as const;

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-18%] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-muted/60 blur-3xl dark:bg-muted/30" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[340px] w-[340px] rounded-full bg-muted/50 blur-3xl dark:bg-muted/20" />
        <div className="absolute left-[-10%] top-1/2 h-[260px] w-[260px] rounded-full bg-muted/40 blur-3xl dark:bg-muted/10" />
      </div>
      <script
        id="nova-homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webApplicationJsonLd, websiteJsonLd]),
        }}
      />
      <div className="container mx-auto px-4 pb-24 pt-12 sm:pt-16">
        <nav className="flex items-center justify-between py-4">
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

        <main className="mx-auto mt-20 max-w-5xl space-y-24">
          <section className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  A calm space to meet your thoughts
                </div>
                <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  Your AI-powered journal that still feels personal
                </h1>
                <p className="text-lg text-muted-foreground">
                  Nova keeps daily reflection approachable. Capture what happened,
                  notice how you felt, and return to insights that help you grow
                  without overwhelm.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/sign-up">Start journaling free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">See how Nova works</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card needed. Start in under two minutes.
              </p>
            </div>

            <div className="space-y-5 border-l border-border/60 pl-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                This evening&apos;s prompt
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Prompt</p>
                  <p className="text-lg leading-relaxed text-foreground">
                    Where did you feel most like yourself today?
                  </p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  I noticed a quiet ease walking home after lunch - the air was cool
                  and I finally paused before diving back into work
                  <span
                    aria-hidden="true"
                    className="relative ml-1 inline-block h-[1.45em] align-baseline"
                  >
                    <span className="absolute inset-y-0 right-0 w-px animate-pulse bg-primary/70" />
                  </span>
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1">Mood: steady</span>
                  <span className="rounded-full bg-muted px-3 py-1">Tag: gratitude</span>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="space-y-14">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">
                A daily rhythm that stays with you
              </h2>
              <p className="text-base text-muted-foreground">
                Journaling with Nova stays intentionally simple: gentle prompts,
                effortless capture, and reflections that surface when you need
                them. It is a calm loop you can actually keep.
              </p>
            </div>
            <ol className="space-y-10">
              <li className="flex gap-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60">
                  <PenLine className="h-5 w-5 text-primary" />
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">
                    Capture what matters
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start with a gentle prompt or free-write. Add voice notes or tags
                    when it helps, skip it when it does not.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60">
                  <Brain className="h-5 w-5 text-primary" />
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">
                    Reflect with context
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Notice patterns over time with gentle insight summaries. Nova keeps
                    nudges light so reflection does not feel like homework.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60">
                  <Shield className="h-5 w-5 text-primary" />
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">
                    Feel safe showing up
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your entries stay encrypted and under your control. You decide what
                    to keep, export, or delete with no hidden switches.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section className="space-y-14">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">
                Built for the humans behind the entries
              </h2>
              <p className="text-base text-muted-foreground">
                Nova is a companion, not a megaphone. We keep the focus on your story
                with clear privacy language, calm reminders, and an interface that
                invites you back gently.
              </p>
              <div className="border-l-2 border-primary/40 pl-4 text-sm leading-6 text-muted-foreground">
                "I read last month&apos;s notes before bed and realized how far I have
                come. Little reminders like that keep me showing up."
              </div>
            </div>
            <div className="grid gap-10 sm:grid-cols-2">
              {testimonials.map((testimonial) => (
                <figure key={testimonial.name} className="space-y-4">
                  <blockquote className="text-base leading-relaxed text-muted-foreground">
                    "{testimonial.quote}"
                  </blockquote>
                  <figcaption className="text-sm font-medium text-foreground">
                    {testimonial.name}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {testimonial.role}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="space-y-10 border-t border-border/60 pt-12">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Sit down with Nova when it helps
                </h2>
                <p className="text-base text-muted-foreground">
                  Whether it is a single line or a longer reflection, Nova keeps the ritual gentle and your entries grounded.
                </p>
              </div>
              <div className="flex justify-start pt-1 md:justify-end md:pt-0">
                <Button size="lg" asChild>
                  <Link href="/sign-up">Start journaling free</Link>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Private by default. Leave anytime.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
