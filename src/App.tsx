import { useReducer, useState } from 'react';
import { Lobby } from './components/Lobby';
import { TurnIntro } from './components/TurnIntro';
import { GameBoard } from './components/GameBoard';
import { TurnSummary } from './components/TurnSummary';
import { GameOver } from './components/GameOver';
import { gameReducer, initialGameState } from './state/gameReducer';
import { shuffle } from './data/wordLoader';
import type { StartGamePayload } from './types/index';
import './App.css';

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, initialGameState);
  const [lastSetup, setLastSetup] = useState<StartGamePayload | null>(null);

  const startGame = (payload: StartGamePayload) => {
    setLastSetup(payload);
    dispatch({ type: 'START_GAME', payload });
  };

  const playAgain = () => {
    if (!lastSetup) {
      dispatch({ type: 'RESET' });
      return;
    }
    // Same teams and settings, freshly shuffled words.
    dispatch({ type: 'START_GAME', payload: { ...lastSetup, wordPool: shuffle(lastSetup.wordPool) } });
  };

  return (
    <div className="app">
      {game.phase === 'LOBBY' && <Lobby onStartGame={startGame} />}

      {game.phase === 'TURN_INTRO' && (
        <TurnIntro
          key={`intro-${game.turnKey}`}
          game={game}
          onReady={() => dispatch({ type: 'BEGIN_TURN' })}
          onQuit={() => dispatch({ type: 'RESET' })}
        />
      )}

      {game.phase === 'PLAYING' && (
        <GameBoard
          key={`turn-${game.turnKey}`}
          game={game}
          onCorrect={(timeRemaining) => dispatch({ type: 'CORRECT', payload: { timeRemaining } })}
          onSkip={(timeRemaining) => dispatch({ type: 'SKIP', payload: { timeRemaining } })}
          onFoul={(timeRemaining) => dispatch({ type: 'FOUL', payload: { timeRemaining } })}
          onTimeUp={() => dispatch({ type: 'TURN_ENDED', payload: { timeRemaining: 0 } })}
          onQuit={() => dispatch({ type: 'RESET' })}
        />
      )}

      {game.phase === 'TURN_SUMMARY' && (
        <TurnSummary
          key={`summary-${game.turnKey}`}
          game={game}
          onContinue={() => dispatch({ type: 'ADVANCE' })}
        />
      )}

      {game.phase === 'GAME_OVER' && (
        <GameOver game={game} onPlayAgain={playAgain} onBackToLobby={() => dispatch({ type: 'RESET' })} />
      )}
    </div>
  );
}
