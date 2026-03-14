import { en, type TranslationKey } from "./en";
import { ne } from "./ne";

export type Locale = "en" | "ne";
export type { TranslationKey };

export const translations: Record<Locale, Record<TranslationKey, string>> = { en, ne };
