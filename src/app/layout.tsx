import type { Metadata } from "next";
import Image from "next/image";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import {
  siteDescription,
  siteKeywords,
  siteName,
  siteOgImage,
  siteTwitterHandle,
  siteUrl,
} from "@/shared/lib/site-metadata";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nova - AI Personal Journal",
    template: "%s | Nova",
  },
  description: siteDescription,
  keywords: siteKeywords,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "Productivity",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Nova - AI Personal Journal",
    description: siteDescription,
    siteName,
    images: [
      {
        url: siteOgImage,
        width: 1200,
        height: 630,
        alt: "Nova journaling application preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: siteTwitterHandle,
    site: siteTwitterHandle,
    title: "Nova - AI Personal Journal",
    description: siteDescription,
    images: [siteOgImage],
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
  icons: {
    icon: [
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico?v=2", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png?v=2",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png?v=2",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <div
            id="nova-splash"
            aria-hidden="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-white opacity-100 transition-opacity duration-500"
          >
            <div className="flex flex-col items-center gap-6">
              <Image
                src="/nova-logo.svg"
                alt="Nova"
                width={96}
                height={96}
                priority
                className="h-24 w-24"
              />
              <p className="text-sm font-medium tracking-[0.3em] text-slate-500">
                JOURNALING REIMAGINED
              </p>
            </div>
          </div>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
