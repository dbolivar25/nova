import type { MetadataRoute } from "next";

import {
  siteDescription,
  siteName,
  siteUrl,
} from "@/shared/lib/site-metadata";

const THEME_COLOR = "#000000";
const BACKGROUND_COLOR = "#ffffff";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: siteUrl,
    name: siteName,
    short_name: "Nova",
    description: siteDescription,
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    prefer_related_applications: false,
    icons: [
      {
        src: "/nova-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/android-chrome-192x192.png?v=2",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png?v=2",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png?v=2",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/nova-logo-w-bg.svg",
        sizes: "1200x630",
        type: "image/svg+xml",
      },
    ],
    categories: ["productivity", "lifestyle"],
    shortcuts: [
      {
        name: "Start journaling",
        short_name: "Journal",
        description: "Open Nova to create a new journal entry",
        url: "/",
      },
    ],
  };
}
