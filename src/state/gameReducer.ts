import type {
  GameAction,
  GameContext,
  Player,
  StartGamePayload,
  Team,
  TeamDraft,
} from '../types/index';
import { pickWord } from '../data/wordLoader';

/** Changing the word costs a point, breaking a rule costs three. */
export const SKIP_PENALTY = 1;
export const FOUL_PENALTY = 3;

export const TEAM_COLOR_COUNT = 8;

interface TurnTally {
  correct: number;
  skipped: number;
  fouls: number;
  points: number;
  bestStreak: number;
}

const emptyTally: TurnTally = { correct: 0, skipped: 0, fouls: 0, points: 0, bestStreak: 0 };

export interface GameState extends GameContext {
  turnTally: TurnTally;
}

export const initialGameState: GameState = {
  phase: 'LOBBY',
  mode: 'ROUNDS',
  wordLanguage: 'en',
  teams: [],
  players: [],
  activeTeamIndex: 0,
  roundCount: 3,
  currentRound: 1,
  turnDuration: 60,
  requireReadyAfterPass: true,
  currentWord: null,
  usedWords: [],
  wordPool: [],
  turnKey: 0,
  lastTurn: null,
  winnerTeamIds: [],
  turnTally: emptyTally,
};

function buildRoster(drafts: TeamDraft[], turnDuration: number) {
  const teams: Team[] = [];
  const players: Player[] = [];

  drafts.forEach((draft, index) => {
    const teamId = `team-${index + 1}`;
    const names = draft.playerNames.map((name) => name.trim()).filter(Boolean);
    const playerIds = names.map((_, memberIndex) => `${teamId}-p${memberIndex + 1}`);

    names.forEach((name, memberIndex) => {
      players.push({ id: playerIds[memberIndex], name, teamId });
    });

    teams.push({
      id: teamId,
      name: names.join(' & '),
      colorIndex: index % TEAM_COLOR_COUNT,
      playerIds,
      score: 0,
      correct: 0,
      skipped: 0,
      fouls: 0,
      streak: 0,
      bestStreak: 0,
      timeUsed: 0,
      remainingTime: turnDuration,
      eliminated: false,
      turnsTaken: 0,
    });
  });

  return { teams, players };
}

/** The player holding the phone, and the teammate doing the guessing. */
export function getTurnRoles(state: GameContext, team: Team | null) {
  if (!team || team.playerIds.length === 0) {
    return { describer: null, guesser: null };
  }
  const byId = new Map(state.players.map((player) => [player.id, player]));
  // turnsTaken is incremented as a turn opens, so the first turn is index 0.
  const size = team.playerIds.length;
  const describerIndex = (Math.max(1, team.turnsTaken) - 1) % size;
  const guesserIndex = (describerIndex + 1) % size;
  return {
    describer: byId.get(team.playerIds[describerIndex]) ?? null,
    guesser: byId.get(team.playerIds[guesserIndex]) ?? null,
  };
}

export function getActiveTeam(state: GameContext): Team | null {
  return state.teams[state.activeTeamIndex] ?? null;
}

function nextAliveTeamIndex(teams: Team[], fromIndex: number): number {
  for (let offset = 1; offset <= teams.length; offset += 1) {
    const candidate = (fromIndex + offset) % teams.length;
    if (!teams[candidate].eliminated) return candidate;
  }
  return fromIndex;
}

function computeWinners(teams: Team[], mode: GameContext['mode']): string[] {
  if (teams.length === 0) return [];

  if (mode === 'RELAY') {
    const alive = teams.filter((team) => !team.eliminated);
    const pool = alive.length > 0 ? alive : teams;
    const best = Math.max(...pool.map((team) => team.remainingTime));
    return pool.filter((team) => team.remainingTime === best).map((team) => team.id);
  }

  const best = Math.max(...teams.map((team) => team.score));
  const leaders = teams.filter((team) => team.score === best);
  if (leaders.length === 1) return leaders.map((team) => team.id);

  // Tie-break on raw correct guesses, then on the fewest fouls.
  const mostCorrect = Math.max(...leaders.map((team) => team.correct));
  const byCorrect = leaders.filter((team) => team.correct === mostCorrect);
  if (byCorrect.length === 1) return byCorrect.map((team) => team.id);

  const fewestFouls = Math.min(...byCorrect.map((team) => team.fouls));
  return byCorrect.filter((team) => team.fouls === fewestFouls).map((team) => team.id);
}

/**
 * SPRINT: the turn is a single word, so it closes the moment the word is
 * answered or the clock runs out - the phone travels on with no summary screen
 * in between. `timeRemaining` is what was left on the word's clock.
 */
function advanceSprint(state: GameState, timeRemaining: number, missed: boolean): GameState {
  const activeTeam = getActiveTeam(state);
  const spent = Math.max(0, state.turnDuration - Math.max(0, timeRemaining));

  const teams = activeTeam
    ? state.teams.map((team) => (
        team.id === activeTeam.id
          ? { ...team, timeUsed: team.timeUsed + spent, streak: missed ? 0 : team.streak }
          : team
      ))
    : state.teams;

  const banked: GameState = { ...state, teams };

  const isLastTeamOfRound = banked.activeTeamIndex >= banked.teams.length - 1;
  const nextRound = isLastTeamOfRound ? banked.currentRound + 1 : banked.currentRound;

  if (nextRound > banked.roundCount) {
    return {
      ...banked,
      phase: 'GAME_OVER',
      currentWord: null,
      winnerTeamIds: computeWinners(banked.teams, 'SPRINT'),
    };
  }

  const nextIndex = isLastTeamOfRound ? 0 : banked.activeTeamIndex + 1;
  return enterTurn(banked, { activeTeamIndex: nextIndex, currentRound: nextRound });
}

/** Moves the game into a team's turn, showing the hand-off screen when asked. */
function enterTurn(
  state: GameState,
  options: { activeTeamIndex: number; currentRound: number }
): GameState {
  const withTurnCount = state.teams.map((team, index) => (
    index === options.activeTeamIndex ? { ...team, turnsTaken: team.turnsTaken + 1 } : team
  ));

  const needsHandoff = state.mode === 'ROUNDS' ? true : state.requireReadyAfterPass;

  const base: GameState = {
    ...state,
    teams: withTurnCount,
    activeTeamIndex: options.activeTeamIndex,
    currentRound: options.currentRound,
    turnKey: state.turnKey + 1,
    turnTally: emptyTally,
    lastTurn: null,
  };

  if (needsHandoff) {
    return { ...base, phase: 'TURN_INTRO', currentWord: null };
  }

  const { word, used } = pickWord(state.wordPool, state.usedWords);
  return { ...base, phase: 'PLAYING', currentWord: word, usedWords: used };
}

/** Applies a scoring event to the active team and deals a fresh word. */
function scoreAndDeal(
  state: GameState,
  change: { points: number; correct?: boolean; skipped?: boolean; foul?: boolean }
): GameState {
  const activeTeam = getActiveTeam(state);
  if (!activeTeam) return state;

  const streak = change.correct ? activeTeam.streak + 1 : 0;
  const bestStreak = Math.max(activeTeam.bestStreak, streak);

  const teams = state.teams.map((team) => (
    team.id === activeTeam.id
      ? {
          ...team,
          score: team.score + change.points,
          correct: team.correct + (change.correct ? 1 : 0),
          skipped: team.skipped + (change.skipped ? 1 : 0),
          fouls: team.fouls + (change.foul ? 1 : 0),
          streak,
          bestStreak,
        }
      : team
  ));

  const { word, used } = pickWord(state.wordPool, state.usedWords);

  return {
    ...state,
    teams,
    currentWord: word,
    usedWords: used,
    turnTally: {
      correct: state.turnTally.correct + (change.correct ? 1 : 0),
      skipped: state.turnTally.skipped + (change.skipped ? 1 : 0),
      fouls: state.turnTally.fouls + (change.foul ? 1 : 0),
      points: state.turnTally.points + change.points,
      bestStreak: Math.max(state.turnTally.bestStreak, streak),
    },
  };
}

/** RELAY keeps a running bank of time per team; write the clock back onto it. */
function syncClock(state: GameState, timeRemaining: number): GameState {
  if (state.mode !== 'RELAY') return state;

  const activeTeam = getActiveTeam(state);
  if (!activeTeam) return state;

  const remaining = Math.max(0, timeRemaining);
  const teams = state.teams.map((team) => (
    team.id === activeTeam.id
      ? { ...team, remainingTime: remaining, timeUsed: state.turnDuration - remaining }
      : team
  ));

  return { ...state, teams };
}

function finishTurn(state: GameState, timeRemaining: number, eliminated: boolean): GameState {
  const synced = syncClock(state, timeRemaining);
  const activeTeam = getActiveTeam(synced);
  if (!activeTeam) return synced;

  const teams = synced.teams.map((team) => {
    if (team.id !== activeTeam.id) return team;
    if (synced.mode === 'RELAY') {
      return {
        ...team,
        eliminated: team.eliminated || eliminated,
        remainingTime: eliminated ? 0 : team.remainingTime,
        streak: eliminated ? 0 : team.streak,
      };
    }
    // ROUNDS: the turn always burns the whole clock, then it is handed back full.
    return {
      ...team,
      timeUsed: team.timeUsed + (synced.turnDuration - Math.max(0, timeRemaining)),
      remainingTime: synced.turnDuration,
      streak: 0,
    };
  });

  return {
    ...synced,
    teams,
    phase: 'TURN_SUMMARY',
    currentWord: null,
    lastTurn: {
      teamId: activeTeam.id,
      correct: synced.turnTally.correct,
      skipped: synced.turnTally.skipped,
      fouls: synced.turnTally.fouls,
      points: synced.turnTally.points,
      bestStreak: synced.turnTally.bestStreak,
      eliminated,
    },
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const payload = action.payload as StartGamePayload;
      const { teams, players } = buildRoster(payload.teamDrafts, payload.turnDuration);
      if (teams.length < 2) return state;

      const base: GameState = {
        ...initialGameState,
        phase: 'TURN_INTRO',
        mode: payload.mode,
        wordLanguage: payload.wordLanguage,
        teams,
        players,
        roundCount: payload.roundCount,
        currentRound: 1,
        turnDuration: payload.turnDuration,
        requireReadyAfterPass: payload.requireReadyAfterPass,
        wordPool: payload.wordPool,
        usedWords: [],
        turnKey: 0,
      };

      return enterTurn(base, { activeTeamIndex: 0, currentRound: 1 });
    }

    case 'BEGIN_TURN': {
      if (state.phase !== 'TURN_INTRO') return state;
      const { word, used } = pickWord(state.wordPool, state.usedWords);
      return { ...state, phase: 'PLAYING', currentWord: word, usedWords: used };
    }

    case 'CORRECT': {
      if (state.phase !== 'PLAYING') return state;
      const scored = scoreAndDeal(state, { points: 1, correct: true });

      if (state.mode === 'ROUNDS') {
        return scored;
      }

      // SPRINT: one word per turn - the phone moves on the instant it lands.
      if (state.mode === 'SPRINT') {
        return advanceSprint(scored, action.payload.timeRemaining, false);
      }

      // RELAY: a correct guess ends the turn and the phone travels on.
      const synced = syncClock(scored, action.payload.timeRemaining);
      const nextIndex = nextAliveTeamIndex(synced.teams, synced.activeTeamIndex);
      return enterTurn(synced, { activeTeamIndex: nextIndex, currentRound: synced.currentRound });
    }

    case 'SKIP': {
      if (state.phase !== 'PLAYING') return state;
      return scoreAndDeal(state, { points: -SKIP_PENALTY, skipped: true });
    }

    case 'FOUL': {
      if (state.phase !== 'PLAYING') return state;
      return scoreAndDeal(state, { points: -FOUL_PENALTY, foul: true });
    }

    case 'TURN_ENDED': {
      if (state.phase !== 'PLAYING') return state;
      // SPRINT never stops on a summary: a missed word just passes the phone.
      if (state.mode === 'SPRINT') {
        return advanceSprint(state, 0, true);
      }
      return finishTurn(state, 0, state.mode === 'RELAY');
    }

    case 'ADVANCE': {
      if (state.phase !== 'TURN_SUMMARY') return state;

      if (state.mode === 'RELAY') {
        const alive = state.teams.filter((team) => !team.eliminated);
        if (alive.length <= 1) {
          return { ...state, phase: 'GAME_OVER', winnerTeamIds: computeWinners(state.teams, 'RELAY') };
        }
        const nextIndex = nextAliveTeamIndex(state.teams, state.activeTeamIndex);
        return enterTurn(state, { activeTeamIndex: nextIndex, currentRound: state.currentRound });
      }

      const isLastTeamOfRound = state.activeTeamIndex >= state.teams.length - 1;
      const nextRound = isLastTeamOfRound ? state.currentRound + 1 : state.currentRound;
      if (nextRound > state.roundCount) {
        return { ...state, phase: 'GAME_OVER', winnerTeamIds: computeWinners(state.teams, 'ROUNDS') };
      }

      const nextIndex = isLastTeamOfRound ? 0 : state.activeTeamIndex + 1;
      return enterTurn(state, { activeTeamIndex: nextIndex, currentRound: nextRound });
    }

    case 'RESET':
      return { ...initialGameState };

    default:
      return state;
  }
}
