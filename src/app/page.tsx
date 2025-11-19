import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PenLine, Brain, Shield, CalendarDays, Feather, Sparkles } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { siteDescription, siteName, siteOgImage, siteUrl } from "@/shared/lib/site-metadata";

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

const heroPoints = [
  "Private by default",
  // "Designed for evenings",
  "Leave anytime",
] as const;

const featureHighlights = [
  {
    title: "Prompts that listen",
    description:
      "Journal with a gentle nudge or switch to free-write instantly. Nova adjusts to your tone and time of day so nothing feels forced.",
    icon: PenLine,
  },
  {
    title: "Insights when you want them",
    description:
      "Mood trends, tags, and context cards surface patterns without overwhelming dashboards. You decide when to explore.",
    icon: Brain,
  },
  {
    title: "Privacy you can trust",
    description:
      "Entries stay encrypted and under your control. Export, delete, or keep things offline—no hidden feeds or social pressure.",
    icon: Shield,
  },
] as const;

const rituals = [
  {
    title: "Arrive softly",
    description:
      "Open Nova to a quiet check-in matched to your schedule. A short prompt and breath help you transition out of the day.",
    detail: "Grounding prompt + reminder",
    icon: CalendarDays,
  },
  {
    title: "Capture what moved you",
    description:
      "Type a few lines, add a voice note, or drop a quick tag. Everything lives in one calm canvas so you can linger or keep it brief.",
    detail: "Text, audio, tags, moods",
    icon: Feather,
  },
  {
    title: "Return with context",
    description:
      "Insight cards resurface past entries around similar themes or seasons, reminding you how far you have come.",
    detail: "Gentle resurfacing",
    icon: Brain,
  },
] as const;

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

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground antialiased">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-[-18%] h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl dark:bg-primary/30" />
        <div className="absolute right-[-10%] top-[20%] h-[380px] w-[380px] rounded-full bg-muted/50 blur-[110px] dark:bg-muted/20" />
        <div className="absolute left-[-10%] bottom-[-22%] h-[360px] w-[360px] rounded-full bg-muted/40 blur-[100px] dark:bg-muted/15" />
        <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:120px_120px]" />
        </div>
      </div>

      <script
        id="nova-homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webApplicationJsonLd, websiteJsonLd]),
        }}
      />

      <div className="container mx-auto px-4 pb-24 pt-10 sm:pt-14">
        <nav className="flex flex-nowrap items-center justify-between gap-4 border-b border-border/60 pb-6 text-left">
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
            <p className="text-2xl font-semibold leading-tight text-primary">Nova</p>
          </div>
          <div className="flex flex-nowrap items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </nav>

        <main className="mx-auto mt-14 flex max-w-6xl flex-col gap-20 sm:mt-16">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary/10 via-background to-background px-6 py-12 shadow-lg shadow-primary/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.1),transparent_30%)]" />
            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  Quiet journaling companion
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                    An unhurried space for honest reflection
                  </h1>
                  <p className="text-lg leading-8 text-muted-foreground">
                    Nova greets you with a gentle prompt, subtle ambient cues, and plenty of breathing room.
                    Capture what moved you, tag feelings if it helps, and leave with a calmer, clearer mind.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {heroPoints.map((point) => (
                    <span key={point} className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {point}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="lg" asChild>
                    <Link href="/sign-up">Start journaling free</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#features">See how it feels</Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-6 -z-10 bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-3xl" />
                <div className="relative overflow-hidden rounded-[18px] bg-background/80 shadow-xl shadow-primary/10 ring-1 ring-border/60">
                  <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                      Tonight&apos;s prompt
                    </span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                      Gentle focus
                    </span>
                  </div>
                  <div className="space-y-5 px-5 py-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        Prompt
                      </p>
                      <p className="mt-2 text-xl leading-relaxed text-foreground">
                        What moment reminded you to slow down today?
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Hearing the kettle whistle pulled me out of a busy afternoon. I stood by the window,
                      breathed in the steam, and felt my shoulders release.
                      <span
                        aria-hidden="true"
                        className="relative ml-[2px] inline-block h-6 w-[8px] align-text-bottom"
                      >
                        <span className="absolute inset-x-0 bottom-0 top-[8px] bg-primary opacity-0 [animation:caret-block_1.1s_steps(2,start)_infinite]" />
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/60 px-3 py-1">Tag · stillness</span>
                      <span className="rounded-full border border-border/60 px-3 py-1">Reminder · breathe</span>
                      <span className="rounded-full border border-border/60 px-3 py-1">Mood · unwinding</span>
                    </div>
                    <div className="grid gap-3 border-t border-border/60 pt-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Check-in</span>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                          Energy · steady
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-foreground">Unwinding</p>
                        <p className="text-sm text-muted-foreground">Gratitude loop · 2 insights saved</p>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-primary/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section >

          <section id="features" className="space-y-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">
                What makes Nova different
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                A journal that meets you with softness, not streaks
              </h2>
              <p className="text-base text-muted-foreground">
                Nova is built around real rituals: gentle prompts, calm capture, and insight only when you ask.
                No performative feeds, no productivity pressure—just a private companion.
              </p>
            </div>
            <div className="grid gap-10 lg:grid-cols-3">
              {featureHighlights.map((feature) => (
                <div key={feature.title} className="space-y-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/70">
                    <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">{feature.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  <div className="h-px w-full bg-gradient-to-r from-primary/40 via-border to-transparent" />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">
                Ritual, clarified
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                How Nova holds the shape of your evenings
              </h2>
              <p className="text-base text-muted-foreground">
                Each flow mirrors what happens once you sign in: arrive, capture, then revisit.
                Everything stays calm so you can focus on noticing what changed.
              </p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {rituals.map((ritual, index) => (
                <li key={ritual.title} className="relative space-y-3">
                  <div className="inline-flex items-center gap-3 rounded-full bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card/70 text-sm font-semibold text-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {ritual.detail}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/70">
                      <ritual.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </span>
                    <p className="text-base font-semibold text-foreground">{ritual.title}</p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{ritual.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">
                Heard in Nova
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Built for the humans behind each entry
              </h2>
              <p className="text-base text-muted-foreground">
                People come to Nova to wind down after work, note a bright spot between meetings,
                or process the heavier moments. Their words keep us honest.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {testimonials.map((testimonial) => (
                <figure
                  key={testimonial.name}
                  className="rounded-2xl border border-border/60 bg-background/70 p-6 text-sm leading-relaxed text-muted-foreground"
                >
                  <blockquote>&ldquo;{testimonial.quote}&rdquo;</blockquote>
                  <figcaption className="mt-4 text-sm font-semibold text-foreground">
                    {testimonial.name}
                    <span className="block text-xs font-normal uppercase tracking-[0.3em] text-muted-foreground">
                      {testimonial.role}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/12 via-card to-card px-8 py-12 text-center shadow-lg shadow-primary/10">
            <div className="mx-auto max-w-2xl space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">
                Stay close to your story
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Sit down with Nova whenever you need to reset
              </h2>
              <p className="text-base text-muted-foreground">
                Whether it is a single sentence or a longer reflection, Nova keeps the ritual gentle.
                Sign up in minutes and keep every entry under your control.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/sign-up">Start journaling free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sign-in">Return to my space</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Private sync · Optional reminders · Export anytime</p>
            </div>
          </section>
        </main >
      </div >
    </div >
  );
}
