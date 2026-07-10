import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

function detectLocale(request: NextRequest): Locale {
  const accept = request.headers.get("accept-language") ?? "";
  const preferred = accept
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase())
    .find((tag) => tag.startsWith("en") || tag.startsWith("ko"));
  if (preferred?.startsWith("en")) return "en";
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Run on all paths except Next internals, API, and static files (anything with a dot).
    "/((?!api|_next|images|favicon\\.ico|.*\\..*).*)",
  ],
};
