export type GameState = 'LOBBY' | 'IN_GAME' | 'GAME_OVER';
export type GameMode = 'MULTI_PHONE' | 'SINGLE_PHONE';
export type PauseReason = 'NEXT_WORD' | 'PASS_PHONE' | null;

export interface Player {
  id: string;
  name: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  score: number;
  streak?: number;
  bestStreak?: number;
  remainingTime?: number;
  eliminated?: boolean;
  memberIds?: string[];
}

export interface GameContext {
  state: GameState;
  mode: GameMode;
  requireReadyAfterPass: boolean;
  teams: Team[];
  currentTeamIndex: number;
  players: Player[];
  currentPlayerIndex: number;
  turnResetKey: number;
  timerDuration: number;
  currentWord: string | null;
  usedWords: Set<string>;
  allWords: string[];
  isPaused: boolean;
  pauseReason: PauseReason;
  winnerTeamId: string | null;
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
