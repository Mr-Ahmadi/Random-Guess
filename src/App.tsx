import { useReducer, useEffect, useState } from 'react';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { gameReducer, initialGameState } from './state/gameReducer';
import { loadWords } from './data/wordLoader';
import type { GameMode } from './types';
import './App.css';

function App() {
  const [gameContext, dispatch] = useReducer(gameReducer, initialGameState);
  const [allWordsLoaded, setAllWordsLoaded] = useState<string[]>([]);
  const [wordsLoading, setWordsLoading] = useState(true);

  useEffect(() => {
    loadWords()
      .then(setAllWordsLoaded)
      .catch(console.error)
      .finally(() => setWordsLoading(false));
  }, []);

  const handleStartGame = (
    mode: GameMode,
    names: string[],
    timerDuration: number,
    requireReadyAfterPass: boolean
  ) => {
    dispatch({
      type: 'INITIALIZE_GAME',
      payload: {
        mode,
        teamNames: mode === 'MULTI_PHONE' ? names : undefined,
        playerNames: mode === 'SINGLE_PHONE' ? names : undefined,
        timerDuration,
        requireReadyAfterPass,
        allWords: allWordsLoaded.length > 0 ? allWordsLoaded : [], // reducer + getRandomWord use fallback when empty
      },
    });
  };

  const handleNextWord = (timeRemaining?: number) => {
    dispatch({ type: 'NEXT_WORD', payload: { timeRemaining } });
  };

  const handleSkipWord = (timeRemaining?: number) => {
    dispatch({ type: 'SKIP_WORD', payload: { timeRemaining } });
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_GAME' });
  };

  const handleResume = () => {
    dispatch({ type: 'RESUME_GAME' });
  };

  const handleTimerEnd = (timeRemaining?: number) => {
    dispatch({ type: 'TIMER_ENDED', payload: { timeRemaining } });
  };

  const handleRestartGame = () => {
    dispatch({ type: 'RESTART_GAME' });
  };

  return (
    <>
      <div className="app">
        {gameContext.state === 'LOBBY' && (
          <Lobby
            onStartGame={handleStartGame}
            wordsLoading={wordsLoading}
            wordsReady={allWordsLoaded.length > 0}
          />
        )}
        {gameContext.state === 'IN_GAME' && (
          <GameBoard
            key={`${gameContext.mode}-${gameContext.turnResetKey}`}
            gameContext={gameContext}
            onNextWord={handleNextWord}
            onSkipWord={handleSkipWord}
            onReady={handleResume}
            onPause={handlePause}
            onExit={handleRestartGame}
            onTimerEnd={handleTimerEnd}
          />
        )}
        {gameContext.state === 'GAME_OVER' && (
          <GameOver gameContext={gameContext} onRestartGame={handleRestartGame} />
        )}
      </div>
    </>
  );
}

export default App;
