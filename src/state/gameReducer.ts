import type { GameContext, GameAction } from '../types/index';
import { getRandomWord } from '../data/wordLoader';

export function gameReducer(state: GameContext, action: GameAction): GameContext {
  switch (action.type) {
    case 'INITIALIZE_GAME': {
      const payload = action.payload as {
        teamName: string;
        timerDuration: number;
        allWords: string[];
      };

      const team = {
        id: 'team-1',
        name: payload.teamName,
        score: 0,
      };

      const allWords = payload.allWords;
      const usedWords = new Set<string>();
      const currentWord = getRandomWord(allWords, usedWords);
      usedWords.add(currentWord);

      return {
        state: 'IN_GAME',
        team,
        timerDuration: payload.timerDuration,
        currentWord,
        usedWords,
        allWords,
        isPaused: false,
      };
    }

    case 'NEXT_WORD': {
      if (state.state !== 'IN_GAME' || !state.team) {
        return state;
      }

      const updatedTeam = {
        ...state.team,
        score: state.team.score + 1,
      };

      const currentWord = getRandomWord(state.allWords, state.usedWords);
      state.usedWords.add(currentWord);

      return {
        ...state,
        team: updatedTeam,
        currentWord,
        isPaused: true,
      };
    }

    case 'SKIP_WORD': {
      if (state.state !== 'IN_GAME') {
        return state;
      }

      const currentWord = getRandomWord(state.allWords, state.usedWords);
      state.usedWords.add(currentWord);

      return {
        ...state,
        currentWord,
        isPaused: true,
      };
    }

    case 'PAUSE_GAME': {
      if (state.state !== 'IN_GAME') {
        return state;
      }

      return {
        ...state,
        isPaused: true,
      };
    }

    case 'RESUME_GAME': {
      if (state.state !== 'IN_GAME') {
        return state;
      }

      return {
        ...state,
        isPaused: false,
      };
    }

    case 'TIMER_ENDED': {
      if (state.state !== 'IN_GAME' || !state.team) {
        return state;
      }

      return {
        ...state,
        state: 'GAME_OVER',
      };
    }

    case 'RESTART_GAME': {
      return {
        state: 'LOBBY',
        team: null,
        timerDuration: 60,
        currentWord: null,
        usedWords: new Set<string>(),
        allWords: [],
        isPaused: false,
      };
    }

    default:
      return state;
  }
}

export const initialGameState: GameContext = {
  state: 'LOBBY',
  team: null,
  timerDuration: 60,
  currentWord: null,
  usedWords: new Set<string>(),
  allWords: [],
  isPaused: false,
};
