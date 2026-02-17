import type { GameContext, GameAction, Team, Player } from '../types/index';
import { getRandomWord } from '../data/wordLoader';

type InitializePayload = {
  mode: 'MULTI_PHONE' | 'SINGLE_PHONE';
  teamNames?: string[];
  playerNames?: string[];
  timerDuration: number;
  requireReadyAfterPass?: boolean;
  allWords: string[];
};

type TimedActionPayload = {
  timeRemaining?: number;
};

function createTeam(name: string, index: number, timerDuration?: number): Team {
  return {
    id: `team-${index + 1}`,
    name,
    score: 0,
    streak: 0,
    bestStreak: 0,
    remainingTime: timerDuration,
    eliminated: false,
    memberIds: [],
  };
}

function getNextWord(state: GameContext): string {
  const word = getRandomWord(state.allWords, state.usedWords);
  state.usedWords.add(word);
  return word;
}

function getSingleModeTeam(state: GameContext): Team | null {
  const player = state.players[state.currentPlayerIndex];
  if (!player) return null;
  return state.teams.find((team) => team.id === player.teamId) ?? null;
}

function updateSingleModeTeamTime(state: GameContext, payload?: TimedActionPayload): Team[] {
  const activeTeam = getSingleModeTeam(state);
  if (!activeTeam) return state.teams;

  const remainingTime = Math.max(0, payload?.timeRemaining ?? activeTeam.remainingTime ?? state.timerDuration);
  return state.teams.map((team) => (
    team.id === activeTeam.id ? { ...team, remainingTime } : team
  ));
}

function findNextAlivePlayerIndex(state: GameContext, fromIndex: number, teams: Team[]): number {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const totalPlayers = state.players.length;

  for (let offset = 1; offset <= totalPlayers; offset += 1) {
    const candidateIndex = (fromIndex + offset) % totalPlayers;
    const candidate = state.players[candidateIndex];
    if (!candidate) continue;
    const candidateTeam = teamById.get(candidate.teamId);
    if (candidateTeam && !candidateTeam.eliminated) {
      return candidateIndex;
    }
  }

  return fromIndex;
}

function buildSinglePhoneTeams(playerNames: string[], timerDuration: number): { teams: Team[]; players: Player[] } {
  const cleanNames = playerNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  const half = cleanNames.length / 2;
  const teams: Team[] = [];
  const players: Player[] = [];

  for (let i = 0; i < half; i += 1) {
    const firstPlayerId = `player-${i + 1}`;
    const secondPlayerId = `player-${i + half + 1}`;
    const teamId = `team-${i + 1}`;
    const firstName = cleanNames[i];
    const secondName = cleanNames[i + half];

    teams.push({
      id: teamId,
      name: `${firstName} & ${secondName}`,
      score: 0,
      streak: 0,
      bestStreak: 0,
      remainingTime: timerDuration,
      eliminated: false,
      memberIds: [firstPlayerId, secondPlayerId],
    });

    players.push({
      id: firstPlayerId,
      name: firstName,
      teamId,
    });
  }

  for (let i = half; i < cleanNames.length; i += 1) {
    const playerId = `player-${i + 1}`;
    const teamId = `team-${i - half + 1}`;
    players.push({
      id: playerId,
      name: cleanNames[i],
      teamId,
    });
  }

  return { teams, players };
}

function getPassBehavior(requireReadyAfterPass: boolean) {
  if (requireReadyAfterPass) {
    return {
      isPaused: true,
      pauseReason: 'PASS_PHONE' as const,
    };
  }

  return {
    isPaused: false,
    pauseReason: null,
  };
}

export function gameReducer(state: GameContext, action: GameAction): GameContext {
  switch (action.type) {
    case 'INITIALIZE_GAME': {
      const payload = action.payload as InitializePayload;
      const allWords = payload.allWords;
      const usedWords = new Set<string>();
      const currentWord = getRandomWord(allWords, usedWords);
      usedWords.add(currentWord);

      if (payload.mode === 'SINGLE_PHONE') {
        const { teams, players } = buildSinglePhoneTeams(payload.playerNames ?? [], payload.timerDuration);
        return {
          state: 'IN_GAME',
          mode: 'SINGLE_PHONE',
          requireReadyAfterPass: payload.requireReadyAfterPass ?? true,
          teams,
          currentTeamIndex: 0,
          players,
          currentPlayerIndex: 0,
          turnResetKey: 0,
          timerDuration: payload.timerDuration,
          currentWord,
          usedWords,
          allWords,
          isPaused: false,
          pauseReason: null,
          winnerTeamId: null,
        };
      }

      const teams = (payload.teamNames ?? ['Team 1']).map((teamName, index) => createTeam(teamName, index));
      return {
        state: 'IN_GAME',
        mode: 'MULTI_PHONE',
        requireReadyAfterPass: true,
        teams,
        currentTeamIndex: 0,
        players: [],
        currentPlayerIndex: 0,
        turnResetKey: 0,
        timerDuration: payload.timerDuration,
        currentWord,
        usedWords,
        allWords,
        isPaused: false,
        pauseReason: null,
        winnerTeamId: null,
      };
    }

    case 'NEXT_WORD': {
      if (state.state !== 'IN_GAME') {
        return state;
      }

      if (state.mode === 'SINGLE_PHONE') {
        const payload = action.payload as TimedActionPayload | undefined;
        const teamsWithUpdatedTime = updateSingleModeTeamTime(state, payload);
        const player = state.players[state.currentPlayerIndex];
        if (!player) return state;
        const currentTeam = teamsWithUpdatedTime.find((team) => team.id === player.teamId);
        if (!currentTeam || currentTeam.eliminated) return state;

        const newStreak = (currentTeam.streak ?? 0) + 1;
        const bestStreak = Math.max(currentTeam.bestStreak ?? 0, newStreak);
        const teams = teamsWithUpdatedTime.map((team) => (
          team.id === currentTeam.id
            ? {
                ...team,
                score: team.score + 1,
                streak: newStreak,
                bestStreak,
              }
            : team
        ));
        const nextPlayerIndex = findNextAlivePlayerIndex(state, state.currentPlayerIndex, teams);
        const passBehavior = getPassBehavior(state.requireReadyAfterPass);

        return {
          ...state,
          teams,
          currentPlayerIndex: nextPlayerIndex,
          currentWord: getNextWord(state),
          isPaused: passBehavior.isPaused,
          pauseReason: passBehavior.pauseReason,
          turnResetKey: state.turnResetKey + 1,
        };
      }

      const currentTeam = state.teams[state.currentTeamIndex];
      if (!currentTeam) {
        return state;
      }

      const newStreak = (currentTeam.streak ?? 0) + 1;
      const bestStreak = Math.max(currentTeam.bestStreak ?? 0, newStreak);
      const updatedTeam = {
        ...currentTeam,
        score: currentTeam.score + 1,
        streak: newStreak,
        bestStreak,
      };
      const teams = state.teams.map((team, index) => (
        index === state.currentTeamIndex ? updatedTeam : team
      ));

      return {
        ...state,
        teams,
        currentWord: getNextWord(state),
        isPaused: true,
        pauseReason: 'NEXT_WORD',
      };
    }

    case 'SKIP_WORD': {
      if (state.state !== 'IN_GAME') {
        return state;
      }

      if (state.mode === 'SINGLE_PHONE') {
        const payload = action.payload as TimedActionPayload | undefined;
        const teamsWithUpdatedTime = updateSingleModeTeamTime(state, payload);
        const player = state.players[state.currentPlayerIndex];
        if (!player) return state;
        const teams = teamsWithUpdatedTime.map((team) => (
          team.id === player.teamId ? { ...team, streak: 0 } : team
        ));
        const nextPlayerIndex = findNextAlivePlayerIndex(state, state.currentPlayerIndex, teams);
        const passBehavior = getPassBehavior(state.requireReadyAfterPass);

        return {
          ...state,
          teams,
          currentPlayerIndex: nextPlayerIndex,
          currentWord: getNextWord(state),
          isPaused: passBehavior.isPaused,
          pauseReason: passBehavior.pauseReason,
          turnResetKey: state.turnResetKey + 1,
        };
      }

      const currentTeam = state.teams[state.currentTeamIndex];
      if (!currentTeam) {
        return state;
      }

      const updatedTeam = {
        ...currentTeam,
        streak: 0,
      };
      const teams = state.teams.map((team, index) => (
        index === state.currentTeamIndex ? updatedTeam : team
      ));

      return {
        ...state,
        teams,
        currentWord: getNextWord(state),
        isPaused: true,
        pauseReason: 'NEXT_WORD',
      };
    }

    case 'PAUSE_GAME': {
      if (state.state !== 'IN_GAME') {
        return state;
      }

      return {
        ...state,
        isPaused: true,
        pauseReason: state.pauseReason ?? 'NEXT_WORD',
      };
    }

    case 'RESUME_GAME': {
      if (state.state !== 'IN_GAME') {
        return state;
      }

      return {
        ...state,
        isPaused: false,
        pauseReason: null,
      };
    }

    case 'TIMER_ENDED': {
      if (state.state !== 'IN_GAME') {
        return state;
      }

      if (state.mode === 'MULTI_PHONE') {
        return {
          ...state,
          state: 'GAME_OVER',
        };
      }

      const player = state.players[state.currentPlayerIndex];
      if (!player) {
        return {
          ...state,
          state: 'GAME_OVER',
        };
      }

      const teams = state.teams.map((team) => {
        if (team.id !== player.teamId) return team;
        return {
          ...team,
          remainingTime: 0,
          eliminated: true,
          streak: 0,
        };
      });

      const aliveTeams = teams.filter((team) => !team.eliminated);
      if (aliveTeams.length <= 1) {
        return {
          ...state,
          teams,
          state: 'GAME_OVER',
          winnerTeamId: aliveTeams[0]?.id ?? null,
        };
      }

      const nextPlayerIndex = findNextAlivePlayerIndex(state, state.currentPlayerIndex, teams);
      const passBehavior = getPassBehavior(state.requireReadyAfterPass);
      return {
        ...state,
        teams,
        currentPlayerIndex: nextPlayerIndex,
        currentWord: getNextWord(state),
        isPaused: passBehavior.isPaused,
        pauseReason: passBehavior.pauseReason,
        turnResetKey: state.turnResetKey + 1,
        winnerTeamId: null,
      };
    }

    case 'RESTART_GAME': {
      return {
        state: 'LOBBY',
        mode: 'MULTI_PHONE',
        requireReadyAfterPass: true,
        teams: [],
        currentTeamIndex: 0,
        players: [],
        currentPlayerIndex: 0,
        turnResetKey: 0,
        timerDuration: 60,
        currentWord: null,
        usedWords: new Set<string>(),
        allWords: [],
        isPaused: false,
        pauseReason: null,
        winnerTeamId: null,
      };
    }

    default:
      return state;
  }
}

export const initialGameState: GameContext = {
  state: 'LOBBY',
  mode: 'MULTI_PHONE',
  requireReadyAfterPass: true,
  teams: [],
  currentTeamIndex: 0,
  players: [],
  currentPlayerIndex: 0,
  turnResetKey: 0,
  timerDuration: 60,
  currentWord: null,
  usedWords: new Set<string>(),
  allWords: [],
  isPaused: false,
  pauseReason: null,
  winnerTeamId: null,
};
