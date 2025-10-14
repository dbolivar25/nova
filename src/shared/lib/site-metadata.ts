const FALLBACK_SITE_URL = "https://www.nova-plus.app";
const FALLBACK_URL = new URL(FALLBACK_SITE_URL);
const CANONICAL_HOSTNAME = FALLBACK_URL.hostname;
const CANONICAL_ROOT_HOSTNAME = CANONICAL_HOSTNAME.replace(/^www\./, "");
const CANONICAL_HOST_ROOTS = new Set([
  CANONICAL_ROOT_HOSTNAME,
  "nova-journal.app",
]);

function normalizeUrl(url: string | undefined) {
  if (!url) {
    return FALLBACK_SITE_URL;
  }

  const trimmed = url.trim();

  if (!trimmed) {
    return FALLBACK_SITE_URL;
  }

  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const withProtocol = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    const normalized = new URL(withProtocol);
    const hostnameRoot = normalized.hostname.replace(/^www\./, "");

    if (CANONICAL_HOST_ROOTS.has(hostnameRoot)) {
      normalized.hostname = CANONICAL_HOSTNAME;
    }

    normalized.protocol = "https:";

    const base = normalized.origin;

    if (normalized.pathname === "/") {
      return base;
    }

    const cleanedPath = normalized.pathname.replace(/\/$/, "");
    const search = normalized.search ?? "";
    const hash = normalized.hash ?? "";

    return `${base}${cleanedPath}${search}${hash}`;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const siteUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL,
);

export const siteName = "Nova";

export const siteDescription =
  "Nova is an AI-powered journaling companion that helps you reflect, gain insights, and grow every day.";

export const siteKeywords = [
  "AI journaling app",
  "personal growth journal",
  "daily reflection prompts",
  "mindfulness journal",
  "secure digital diary",
  "mental wellness",
  "guided journaling",
];

export const siteTwitterHandle = "@novajournal";

export const siteOgImage = `${siteUrl}/nova-logo-w-bg.svg`;
