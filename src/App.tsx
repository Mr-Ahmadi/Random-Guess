import { useReducer, useEffect, useState } from 'react';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { gameReducer, initialGameState } from './state/gameReducer';
import { loadWords } from './data/wordLoader';
import './App.css';

function App() {
  const [gameContext, dispatch] = useReducer(gameReducer, initialGameState);
  const [allWordsLoaded, setAllWordsLoaded] = useState<string[]>([]);

  useEffect(() => {
    loadWords().then(setAllWordsLoaded).catch(console.error);
  }, []);

  const handleStartGame = (teamName: string, timerDuration: number) => {
    dispatch({
      type: 'INITIALIZE_GAME',
      payload: {
        teamName,
        timerDuration,
        allWords: allWordsLoaded,
      },
    });
  };

  const handleNextWord = () => {
    dispatch({ type: 'NEXT_WORD' });
  };

  const handleSkipWord = () => {
    dispatch({ type: 'SKIP_WORD' });
  };

  const handleReady = () => {
    dispatch({ type: 'RESUME_GAME' });
  };

  const handleTimerEnd = () => {
    dispatch({ type: 'TIMER_ENDED' });
  };

  const handleRestartGame = () => {
    dispatch({ type: 'RESTART_GAME' });
  };

  return (
    <>
      <div className="app">
        {gameContext.state === 'LOBBY' && <Lobby onStartGame={handleStartGame} />}
        {gameContext.state === 'IN_GAME' && (
          <GameBoard
            gameContext={gameContext}
            onNextWord={handleNextWord}
            onSkipWord={handleSkipWord}
            onReady={handleReady}
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
