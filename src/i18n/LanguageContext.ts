import { createContext } from 'react';
import type { Language, TranslationKey } from './strings';

export type Interpolations = Record<string, string | number>;

export interface I18nValue {
  lang: Language;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Interpolations) => string;
  /** Formats a number using the locale digits (Persian digits for `fa`). */
  n: (value: number) => string;
}

export const LanguageContext = createContext<I18nValue | null>(null);
