import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LanguageContext, type Interpolations } from './LanguageContext';
import { dictionaries, LANGUAGES, type Language, type TranslationKey } from './strings';
import { toPersianDigits } from '../utils/digits';

const STORAGE_KEY = 'dowr.language';

function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'fa') {
      return stored;
    }
  } catch {
    // storage can be blocked; fall through to browser detection
  }

  const preferred = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return preferred?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);
  const dir = LANGUAGES.find((item) => item.id === lang)?.dir ?? 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.dataset.lang = lang;
  }, [lang, dir]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write failures (private mode)
    }
  }, []);

  const value = useMemo(() => {
    const dictionary = dictionaries[lang];

    const n = (input: number) => {
      const text = String(input);
      return lang === 'fa' ? toPersianDigits(text) : text;
    };

    const t = (key: TranslationKey, vars?: Interpolations) => {
      const template = dictionary[key] ?? dictionaries.en[key] ?? key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, name: string) => {
        const replacement = vars[name];
        if (replacement === undefined) return match;
        return typeof replacement === 'number' ? n(replacement) : replacement;
      });
    };

    return { lang, dir, setLang, t, n };
  }, [lang, dir, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
