import type { Language } from '../i18n/strings';
import type { WordDataset } from '../types/index';

export type WordPacks = Record<string, string[]>;

const cache = new Map<Language, WordPacks>();

const FALLBACK: Record<Language, WordPacks> = {
  en: {
    general: ['house', 'window', 'clock', 'mirror', 'umbrella', 'ladder', 'candle', 'suitcase'],
    animals: ['lion', 'zebra', 'dolphin', 'owl', 'camel', 'butterfly', 'penguin', 'crocodile'],
    food: ['bread', 'pizza', 'honey', 'saffron', 'ice cream', 'pomegranate', 'walnut', 'soup'],
  },
  fa: {
    general: ['خانه', 'پنجره', 'ساعت', 'آینه', 'چتر', 'نردبان', 'شمع', 'چمدان'],
    animals: ['شیر', 'گورخر', 'دلفین', 'جغد', 'شتر', 'پروانه', 'پنگوئن', 'تمساح'],
    food: ['نان', 'پیتزا', 'عسل', 'زعفران', 'بستنی', 'انار', 'گردو', 'آش'],
  },
};

export async function loadWordPacks(language: Language): Promise<WordPacks> {
  const cached = cache.get(language);
  if (cached) return cached;

  try {
    const base = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${base}words.${language}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load words.${language}.json (${response.status})`);
    }

    const dataset: WordDataset = await response.json();
    const packs: WordPacks = {};
    Object.entries(dataset.categories ?? {}).forEach(([name, words]) => {
      const clean = (words ?? []).map((word) => word.trim()).filter(Boolean);
      if (clean.length > 0) {
        packs[name] = clean;
      }
    });

    const result = Object.keys(packs).length > 0 ? packs : FALLBACK[language];
    cache.set(language, result);
    return result;
  } catch (error) {
    console.error('Error loading words:', error);
    return FALLBACK[language];
  }
}

/** Flattens the selected packs into a single deduplicated, shuffled pool. */
export function buildWordPool(packs: WordPacks, selected: string[]): string[] {
  const chosen = selected.length > 0 ? selected : Object.keys(packs);
  const pool = new Set<string>();
  chosen.forEach((name) => {
    (packs[name] ?? []).forEach((word) => pool.add(word));
  });
  return shuffle([...pool]);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Picks a word that has not been used yet. Once the pool is exhausted the used
 * list is dropped so play can continue instead of stalling.
 */
export function pickWord(pool: string[], used: string[]): { word: string; used: string[] } {
  if (pool.length === 0) {
    return { word: FALLBACK.en.general[0], used: [] };
  }

  const usedSet = new Set(used);
  const available = pool.filter((word) => !usedSet.has(word));

  if (available.length === 0) {
    const word = pool[Math.floor(Math.random() * pool.length)];
    return { word, used: [word] };
  }

  const word = available[Math.floor(Math.random() * available.length)];
  return { word, used: [...used, word] };
}
