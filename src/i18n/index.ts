import { ko, type Dictionary } from "./ko";
import { en } from "./en";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { ko, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary } from "./ko";
export type { Locale } from "./config";
export { locales, defaultLocale, isLocale } from "./config";
