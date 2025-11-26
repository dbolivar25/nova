import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PenLine, Brain, Shield, CalendarDays, Feather, Sparkles, Moon, Sun, ArrowRight, Quote } from "lucide-react";
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

const featureHighlights = [
  {
    title: "Prompts that listen",
    description:
      "Journal with a gentle nudge or switch to free-write. Nova adjusts to your rhythm and never rushes you.",
    icon: PenLine,
    gradient: "from-amber-500/20 to-orange-500/10",
  },
  {
    title: "Insights when ready",
    description:
      "Patterns emerge when you're curious. No overwhelming dashboards—just calm reflection when you ask.",
    icon: Brain,
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
  {
    title: "Private by design",
    description:
      "Your words stay yours. Encrypted, exportable, and free from social pressure or hidden feeds.",
    icon: Shield,
    gradient: "from-violet-500/20 to-purple-500/10",
  },
] as const;

const rituals = [
  {
    step: "01",
    title: "Arrive softly",
    description:
      "Open Nova to a quiet check-in. A grounding prompt helps you transition from the day's noise into reflection.",
    icon: Moon,
  },
  {
    step: "02",
    title: "Capture what moved you",
    description:
      "Write a few lines, add a tag, or simply sit with the prompt. Everything lives in one calm space.",
    icon: Feather,
  },
  {
    step: "03",
    title: "Return with context",
    description:
      "Insight cards gently surface past entries around similar themes, showing how far you've come.",
    icon: Sun,
  },
] as const;

const testimonials = [
  {
    name: "Amelia R.",
    role: "Therapist",
    quote:
      "Nova keeps my nightly reflection light enough to do, yet meaningful enough to matter. It's the first tool that has actually stuck.",
    avatar: "A",
  },
  {
    name: "Noah P.",
    role: "Product Designer",
    quote:
      "The prompts meet me where I am. Some days it's two lines, other days I write more, but I always leave with a calmer mind.",
    avatar: "N",
  },
] as const;

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient background elements */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Warm gradient orbs */}
        <div className="absolute -left-[20%] top-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/25 via-warm/15 to-transparent blur-3xl animate-float" />
        <div className="absolute -right-[15%] top-[40%] h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-glow/20 via-primary/10 to-transparent blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute left-[30%] -bottom-[20%] h-[400px] w-[600px] rounded-full bg-gradient-to-t from-muted/40 via-accent/20 to-transparent blur-3xl" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]">
          <div className="h-full w-full bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:80px_80px]" />
        </div>
      </div>

      <script
        id="nova-homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webApplicationJsonLd, websiteJsonLd]),
        }}
      />

      <div className="relative">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/nova-logo.svg"
                  alt="Nova Logo"
                  fill
                  className="block dark:hidden"
                  sizes="40px"
                  priority
                />
                <Image
                  src="/nova-logo-dark-mode.svg"
                  alt="Nova Logo"
                  fill
                  className="hidden dark:block"
                  sizes="40px"
                  priority
                />
              </div>
              <span className="font-serif text-2xl font-semibold text-foreground">Nova</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full px-5">
                <Link href="/sign-up">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6">
          {/* Hero Section */}
          <section className="relative py-20 sm:py-28 lg:py-36">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary animate-fade-in-up opacity-0">
                <Sparkles className="h-4 w-4" />
                <span>Your quiet companion for honest reflection</span>
              </div>

              {/* Main headline */}
              <h1 className="font-serif text-5xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl animate-fade-in-up opacity-0 stagger-1">
                An unhurried space for
                <span className="relative mx-3 inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
                    evening
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-primary/20 via-warm/30 to-primary/20 blur-sm" />
                </span>
                reflection
              </h1>

              {/* Subheadline */}
              <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl animate-fade-in-up opacity-0 stagger-2">
                Nova greets you with a gentle prompt and breathing room.
                Capture what moved you, leave with a calmer mind.
              </p>

              {/* CTA buttons */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up opacity-0 stagger-3">
                <Button size="lg" asChild className="h-12 rounded-full px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                  <Link href="/sign-up">
                    Start journaling free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 rounded-full px-8 text-base border-border/60 hover:bg-accent/50">
                  <Link href="#how-it-works">See how it feels</Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up opacity-0 stagger-4">
                {["Private by default", "No streaks or pressure", "Export anytime"].map((point) => (
                  <span key={point} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero visual - Journal mockup */}
            <div className="relative mx-auto mt-16 max-w-3xl animate-fade-in-up opacity-0 stagger-5">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-warm/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-sm">
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Tonight&apos;s Reflection</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Evening prompt
                  </span>
                </div>

                {/* Card content */}
                <div className="p-6 sm:p-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Today&apos;s prompt
                      </p>
                      <p className="mt-3 font-serif text-2xl leading-relaxed text-foreground sm:text-3xl">
                        What moment reminded you to slow down today?
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/40 bg-background/50 p-4">
                      <p className="leading-relaxed text-muted-foreground">
                        Hearing the kettle whistle pulled me out of a busy afternoon. I stood by the window,
                        breathed in the steam, and felt my shoulders finally release.
                        <span
                          aria-hidden="true"
                          className="relative ml-[2px] inline-block h-5 w-[3px] align-text-bottom"
                        >
                          <span className="absolute inset-0 bg-primary opacity-0 [animation:caret-block_1.1s_steps(2,start)_infinite]" />
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {["stillness", "gratitude", "present"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                  Why Nova is different
                </p>
                <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                  A journal that meets you with softness
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                  Built around real rituals: gentle prompts, calm capture, and insight only when you ask.
                </p>
              </div>

              <div className="mt-16 grid gap-8 md:grid-cols-3">
                {featureHighlights.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                    <div className="relative">
                      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-border/50 bg-background/80 shadow-sm transition-transform duration-300 group-hover:scale-110">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mb-3 font-serif text-xl font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="py-20 sm:py-28">
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                  Your evening ritual
                </p>
                <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                  Three gentle steps to clarity
                </h2>
              </div>

              <div className="mt-16 space-y-8">
                {rituals.map((ritual, index) => (
                  <div
                    key={ritual.step}
                    className="group relative flex gap-6 rounded-2xl border border-border/40 bg-card/30 p-6 transition-all duration-300 hover:border-primary/30 hover:bg-card/60 sm:gap-8 sm:p-8"
                  >
                    <div className="flex flex-col items-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 font-serif text-lg font-semibold text-primary transition-colors group-hover:border-primary/50 group-hover:bg-primary/20">
                        {ritual.step}
                      </span>
                      {index < rituals.length - 1 && (
                        <div className="mt-4 h-full w-px bg-gradient-to-b from-primary/30 to-transparent" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="mb-2 flex items-center gap-3">
                        <ritual.icon className="h-5 w-5 text-primary" />
                        <h3 className="font-serif text-xl font-semibold">{ritual.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{ritual.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                  Voices from Nova
                </p>
                <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                  Stories of calm reflection
                </h2>
              </div>

              <div className="mt-16 grid gap-8 md:grid-cols-2">
                {testimonials.map((testimonial) => (
                  <figure
                    key={testimonial.name}
                    className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-8"
                  >
                    <Quote className="absolute right-6 top-6 h-12 w-12 text-primary/10" />
                    <blockquote className="relative text-lg leading-relaxed text-foreground">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 sm:py-28">
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-16">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
              <div className="relative">
                <Sparkles className="mx-auto mb-6 h-10 w-10 text-primary" />
                <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                  Stay close to your story
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                  Whether a single sentence or a longer reflection, Nova keeps the ritual gentle.
                  Begin in minutes and keep every entry under your control.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button size="lg" asChild className="h-12 rounded-full px-8 text-base shadow-lg shadow-primary/25">
                    <Link href="/sign-up">
                      Start journaling free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="h-12 rounded-full px-8 text-base">
                    <Link href="/sign-in">Return to my space</Link>
                  </Button>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  Private sync · Optional reminders · Export anytime
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-muted/20">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6">
                <Image
                  src="/nova-logo.svg"
                  alt="Nova"
                  fill
                  className="block dark:hidden"
                  sizes="24px"
                />
                <Image
                  src="/nova-logo-dark-mode.svg"
                  alt="Nova"
                  fill
                  className="hidden dark:block"
                  sizes="24px"
                />
              </div>
              <span className="font-serif text-lg font-medium">Nova</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nova. Your quiet companion for reflection.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
