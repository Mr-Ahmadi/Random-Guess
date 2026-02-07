export type GameState = 'LOBBY' | 'IN_GAME' | 'GAME_OVER';

export interface Team {
  id: string;
  name: string;
  score: number;
  streak?: number;
  bestStreak?: number;
}

export interface GameContext {
  state: GameState;
  team: Team | null;
  timerDuration: number;
  currentWord: string | null;
  usedWords: Set<string>;
  allWords: string[];
  isPaused: boolean;
}

export interface GameAction {
  type: 'INITIALIZE_GAME' | 'NEXT_WORD' | 'SKIP_WORD' | 'TIMER_ENDED' | 'PAUSE_GAME' | 'RESUME_GAME' | 'RESTART_GAME';
  payload?: unknown;
}

export interface WordDataset {
  categories: {
    [key: string]: string[];
  };
}
