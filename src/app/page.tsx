import Link from "next/link";
import type { Metadata } from "next";
import { PenLine, Brain, Shield, Feather, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { ThemeToggle } from "@/components/shared/layout/theme-toggle";
import { NovaLogo } from "@/components/shared/ui/nova-logo";
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

const features = [
  {
    title: "Gentle prompts",
    description: "Questions that meet you where you are, never demanding more than you can give.",
    icon: PenLine,
  },
  {
    title: "Quiet insights",
    description: "Patterns surface when you're ready. No dashboards, no metrics—just clarity.",
    icon: Brain,
  },
  {
    title: "Private by design",
    description: "Your words stay yours. Encrypted, exportable, and free from feeds.",
    icon: Shield,
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Open to a quiet check-in",
    description: "A grounding prompt helps you transition from the day's noise.",
  },
  {
    number: "02",
    title: "Capture what moved you",
    description: "Write a few lines or sit with the prompt. Everything lives in one calm space.",
  },
  {
    number: "03",
    title: "Return with context",
    description: "Past entries surface around similar themes, showing how far you've come.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        id="nova-homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webApplicationJsonLd, websiteJsonLd]),
        }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <NovaLogo className="h-8 w-8" />
            <span className="font-serif text-xl font-semibold">Nova</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              An unhurried space for{" "}
              <span className="text-muted-foreground">evening reflection</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
              Nova greets you with a gentle prompt and breathing room.
              Capture what moved you, leave with a calmer mind.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="h-11 px-6">
                <Link href="/sign-up">
                  Start journaling free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11 px-6">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          {/* Hero visual */}
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/30 px-5 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Feather className="h-4 w-4" />
                  <span>Tonight&apos;s reflection</span>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Today&apos;s prompt
                </p>
                <p className="mt-3 font-serif text-xl leading-relaxed sm:text-2xl">
                  What moment reminded you to slow down today?
                </p>
                <div className="mt-6 rounded-lg bg-muted/50 p-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Hearing the kettle whistle pulled me out of a busy afternoon. I stood by the window,
                    breathed in the steam, and felt my shoulders finally release.
                    <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-foreground align-text-bottom" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/50 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                A journal that meets you with softness
              </h2>
              <p className="mt-4 text-muted-foreground">
                Built around real rituals—gentle prompts, calm capture, and insight only when you ask.
              </p>
            </div>

            <div className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="text-center sm:text-left">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted sm:mx-0">
                    <feature.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-t border-border/50 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Your evening ritual
              </h2>
              <p className="mt-4 text-muted-foreground">
                Three gentle steps to clarity.
              </p>
            </div>

            <div className="mt-16 space-y-12">
              {steps.map((step, index) => (
                <div key={step.number} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                      {step.number}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="mt-3 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="mt-1 text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-border/50 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <figure>
                <blockquote className="font-serif text-xl leading-relaxed">
                  &ldquo;Nova keeps my nightly reflection light enough to do, yet meaningful enough to matter.
                  It&apos;s the first tool that has actually stuck.&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Amelia R.</span> · Therapist
                </figcaption>
              </figure>
              <figure>
                <blockquote className="font-serif text-xl leading-relaxed">
                  &ldquo;The prompts meet me where I am. Some days it&apos;s two lines, other days more,
                  but I always leave with a calmer mind.&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Noah P.</span> · Product Designer
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/50 px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Stay close to your story
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether a single sentence or a longer reflection, Nova keeps the ritual gentle.
              Begin in minutes and keep every entry under your control.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="h-11 px-6">
                <Link href="/sign-up">
                  Start journaling free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Private by default", "No streaks", "Export anytime"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <NovaLogo className="h-5 w-5" />
            <span className="font-serif text-sm font-medium">Nova</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nova
          </p>
        </div>
      </footer>
    </div>
  );
}
