import type { MetadataRoute } from "next";

// 실도메인: 건전한레저.com (IDN → Punycode)
const FALLBACK_BASE = "https://xn--z69ap3to0moa491o.com";

function siteBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : FALLBACK_BASE;
  return base.replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = siteBase();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/ko/admin", "/en/admin"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
