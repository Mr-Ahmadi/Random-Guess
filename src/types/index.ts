import type { Language } from '../i18n/strings';

/** Screens the game can be on. */
export type Phase =
  | 'LOBBY'
  | 'TURN_INTRO'
  | 'PLAYING'
  | 'TURN_SUMMARY'
  | 'GAME_OVER';

/**
 * ROUNDS - the classic game: a fixed number of timed rounds, every team plays
 * one turn per round and the highest score wins.
 * RELAY  - every team owns a bank of time, the phone travels after each word
 * and a team is out once its bank empties. The team that spent the least time
 * is left standing.
 * SPRINT - one word per turn on a short clock: land it and the phone moves to
 * the next team straight away. Played over rounds, most points wins.
 */
export type GameMode = 'ROUNDS' | 'RELAY' | 'SPRINT';

export interface Player {
  id: string;
  name: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  /** Index into the team colour palette - teammates share it. */
  colorIndex: number;
  playerIds: string[];
  score: number;
  correct: number;
  skipped: number;
  fouls: number;
  streak: number;
  bestStreak: number;
  /** Seconds the team has spent playing so far. */
  timeUsed: number;
  /** RELAY only: seconds left in the bank. */
  remainingTime: number;
  eliminated: boolean;
  /** How many turns this team has taken - decides who describes. */
  turnsTaken: number;
}

export interface TurnStats {
  teamId: string;
  correct: number;
  skipped: number;
  fouls: number;
  points: number;
  bestStreak: number;
  /** Set when the turn ended because a RELAY team burned through its bank. */
  eliminated: boolean;
}

export interface GameContext {
  phase: Phase;
  mode: GameMode;
  wordLanguage: Language;
  teams: Team[];
  players: Player[];
  activeTeamIndex: number;
  roundCount: number;
  currentRound: number;
  /** Seconds granted per turn (ROUNDS), per team bank (RELAY) or per word (SPRINT). */
  turnDuration: number;
  requireReadyAfterPass: boolean;
  currentWord: string | null;
  usedWords: string[];
  wordPool: string[];
  /** Bumped every turn so the timer remounts with a fresh duration. */
  turnKey: number;
  lastTurn: TurnStats | null;
  winnerTeamIds: string[];
}

export interface TeamDraft {
  id: string;
  playerNames: [string, string];
}

export interface StartGamePayload {
  mode: GameMode;
  wordLanguage: Language;
  teamDrafts: TeamDraft[];
  roundCount: number;
  turnDuration: number;
  requireReadyAfterPass: boolean;
  wordPool: string[];
}

export type GameAction =
  | { type: 'START_GAME'; payload: StartGamePayload }
  | { type: 'BEGIN_TURN' }
  | { type: 'CORRECT'; payload: { timeRemaining: number } }
  | { type: 'SKIP'; payload: { timeRemaining: number } }
  | { type: 'FOUL'; payload: { timeRemaining: number } }
  | { type: 'TURN_ENDED'; payload: { timeRemaining: number } }
  | { type: 'ADVANCE' }
  | { type: 'RESET' };

export interface WordDataset {
  language?: Language;
  direction?: 'ltr' | 'rtl';
  categories: Record<string, string[]>;
}
