import type { MetadataRoute } from "next";
import { siteUrl } from "@/shared/lib/site-metadata";

const publicRoutes = ["", "/sign-in", "/sign-up"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
