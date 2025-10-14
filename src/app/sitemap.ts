import type { MetadataRoute } from "next";
import { siteUrl } from "@/shared/lib/site-metadata";

const marketingRoutes = [""]; // Only expose the canonical landing page

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return marketingRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 1,
  }));
}
