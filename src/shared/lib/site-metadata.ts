const FALLBACK_SITE_URL = "https://www.nova-plus.app";
const FALLBACK_URL = new URL(FALLBACK_SITE_URL);
const FALLBACK_HOST_ROOT = FALLBACK_URL.hostname.replace(/^www\./, "");

function parseUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const candidate = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function canonicalizeUrl(url: URL) {
  const normalized = new URL(url.toString());
  const hostnameRoot = normalized.hostname.replace(/^www\./, "");

  if (hostnameRoot === FALLBACK_HOST_ROOT) {
    normalized.hostname = FALLBACK_URL.hostname;
  }

  normalized.protocol = "https:";

  const origin = normalized.origin;
  const pathname =
    normalized.pathname === "/" ? "" : normalized.pathname.replace(/\/$/, "");

  return `${origin}${pathname}${normalized.search}${normalized.hash}`;
}

function resolveSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const parsed = parseUrl(candidate);

    if (parsed) {
      return canonicalizeUrl(parsed);
    }
  }

  return canonicalizeUrl(FALLBACK_URL);
}

export const siteUrl = resolveSiteUrl();

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
