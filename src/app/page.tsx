import type { Metadata } from "next";
import HomePageClient from "./page-client";
import { siteUrl } from "@/shared/lib/site-metadata";

export const metadata: Metadata = {
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    url: siteUrl,
  },
};

export default function Home() {
  return <HomePageClient />;
}
