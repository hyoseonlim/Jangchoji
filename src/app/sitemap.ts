import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/config";

// 실도메인: 건전한레저.com (IDN → Punycode)
const FALLBACK_BASE = "https://xn--z69ap3to0moa491o.com";

function siteBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : FALLBACK_BASE;
  return base.replace(/\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBase();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const home = `${base}/${locale}`;
    const isDefault = locale === defaultLocale;

    entries.push({
      url: home,
      lastModified: now,
      changeFrequency: "weekly",
      priority: isDefault ? 1.0 : 0.9,
    });

    entries.push({
      url: `${base}/${locale}/reserve`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    });

    entries.push({
      url: `${base}/${locale}/reserve?mode=day_use`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return entries;
}
