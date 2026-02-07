import type { WordDataset } from '../types/index';

let cachedWords: string[] = [];

export async function loadWords(): Promise<string[]> {
  if (cachedWords.length > 0) {
    return cachedWords;
  }

  try {
    const base = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${base}words.en.json`);
    if (!response.ok) {
      throw new Error('Failed to load words dataset');
    }

    const dataset: WordDataset = await response.json();
    const allWords: string[] = [];

    Object.values(dataset.categories).forEach((categoryWords) => {
      allWords.push(...categoryWords);
    });

    cachedWords = allWords;
    return allWords;
  } catch (error) {
    console.error('Error loading words:', error);
    // Fallback words if dataset fails to load
    return getFallbackWords();
  }
}

export function getRandomWord(allWords: string[], usedWords: Set<string>): string {
  if (!allWords || allWords.length === 0) {
    return getFallbackWords()[0];
  }
  const availableWords = allWords.filter((word) => !usedWords.has(word));

  if (availableWords.length === 0) {
    // Reshuffle: clear used words and use all words again
    usedWords.clear();
    return allWords[Math.floor(Math.random() * allWords.length)];
  }

  return availableWords[Math.floor(Math.random() * availableWords.length)];
}

function getFallbackWords(): string[] {
  return [
    'apple', 'book', 'cat', 'dog', 'elephant', 'fire', 'guitar', 'house',
    'ice', 'jungle', 'kite', 'lamp', 'moon', 'notebook', 'orange', 'piano',
    'queen', 'river', 'sun', 'tree', 'umbrella', 'violin', 'water', 'xylophone',
    'yellow', 'zebra', 'actor', 'beach', 'camera', 'dance', 'eagle', 'forest',
    'garden', 'helmet', 'island', 'jewelry', 'kitchen', 'library', 'mountain',
    'nature', 'ocean', 'palace', 'quiet', 'rainbow', 'silver', 'thunder', 'universe',
    'victory', 'whale', 'yacht', 'zoo', 'ability', 'balance', 'captain', 'desert'
  ];
}
