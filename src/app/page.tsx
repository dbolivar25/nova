import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  PenLine,
  Brain,
  Shield,
  CalendarDays,
  Feather,
  Sparkles,
} from "lucide-react";
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
    detail: "Grounding prompt + optional reminder",
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
    detail: "Gentle resurfacing when it helps",
    icon: Brain,
  },
] as const;

export default function Home() {
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
      <div className="container mx-auto px-4 pb-24 pt-10 sm:pt-14">
        <nav className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </nav>

        <main className="mx-auto mt-16 flex max-w-6xl flex-col gap-24">
          <section className="space-y-10">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    Quiet journaling companion
                  </div>
                  <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                    Meet Nova, the calm space for honest reflection
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Nova greets you with a gentle prompt, subtle ambient cues, and plenty of breathing room.
                    Capture what moved you, tag feelings if it helps, and leave with a little more ease.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="lg" asChild>
                    <Link href="/sign-up">Start journaling free</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#features">See how it feels</Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Private by default. Leave anytime.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-br from-primary/15 via-transparent to-transparent opacity-80 blur-3xl dark:from-primary/20" />
                <div className="relative rounded-[28px] border border-border/60 bg-card/80 p-6 shadow-lg shadow-black/5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Tonight&apos;s prompt
                    </span>
                    <span>Gentle focus</span>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        Prompt
                      </p>
                      <p className="mt-2 text-lg leading-relaxed text-foreground">
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
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/60 p-4">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                          Mood
                        </p>
                        <p className="mt-1 text-xl font-semibold text-foreground">Unwinding</p>
                        <p className="text-xs text-muted-foreground">Energy · steady</p>
                      </div>
                      <div className="rounded-2xl border border-border/60 p-4">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                          Focus
                        </p>
                        <p className="mt-1 text-xl font-semibold text-foreground">Gratitude loop</p>
                        <p className="text-xs text-muted-foreground">2 insights saved</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/50 px-3 py-1">
                        Tag · stillness
                      </span>
                      <span className="rounded-full border border-border/50 px-3 py-1">
                        Reminder · breathe
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="space-y-10">
            <div className="max-w-2xl space-y-4">
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
            <div className="space-y-6">
              {featureHighlights.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm"
                >
                  <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-border/70">
                    <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-4">
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
            <div className="space-y-6">
              {rituals.map((ritual) => (
                <div
                  key={ritual.title}
                  className="rounded-3xl border border-border/50 bg-background/70 p-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70">
                      <ritual.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-foreground">{ritual.title}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        {ritual.detail}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{ritual.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            <div className="max-w-2xl space-y-4">
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
            <div className="grid gap-8 sm:grid-cols-2">
              {testimonials.map((testimonial) => (
                <figure
                  key={testimonial.name}
                  className="rounded-3xl border border-border/60 bg-card/80 p-6 text-sm leading-relaxed text-muted-foreground"
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

          <section className="rounded-3xl border border-border/60 bg-card/80 px-8 py-12 text-center">
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
              <p className="text-xs text-muted-foreground">
                Private sync · Optional reminders · Export anytime
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
