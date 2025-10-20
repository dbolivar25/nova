import type { Metadata, Viewport } from "next";
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
import { Splash } from "./splash";
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
  openGraph: {
    type: "website",
    locale: "en_US",
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
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
          <Splash />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
