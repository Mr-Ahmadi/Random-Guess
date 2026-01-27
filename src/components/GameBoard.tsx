import { useCallback } from 'react';
import type { GameContext } from '../types/index';
import { useGameTimer } from '../hooks/useGameTimer';
import { playReadyBeep, playGotItBeep, playSkipBeep, playTimeEndedBeep } from '../utils/soundEffects';
import './GameBoard.css';

type GameBoardProps = {
  gameContext: GameContext;
  onNextWord: () => void;
  onSkipWord: () => void;
  onReady: () => void;
  onTimerEnd: () => void;
};

export function GameBoard({ gameContext, onNextWord, onSkipWord, onReady, onTimerEnd }: GameBoardProps) {
  const team = gameContext.team;
  
  const timeRemaining = useGameTimer({
    duration: gameContext.timerDuration,
    isActive: !gameContext.isPaused && gameContext.state === 'IN_GAME',
    onTimerEnd: useCallback(() => {
      playTimeEndedBeep();
      onTimerEnd();
    }, [onTimerEnd]),
  });

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const progressPercent = (timeRemaining / gameContext.timerDuration) * 100;
  const isLowTime = timeRemaining < gameContext.timerDuration * 0.2;

  const handleReady = () => {
    playReadyBeep();
    onReady();
  };

  const handleGotIt = () => {
    playGotItBeep();
    onNextWord();
  };

  const handleSkip = () => {
    playSkipBeep();
    onSkipWord();
  };

  if (!team) return null;

  return (
    <div className="gameboard-container">
      <div className="gameboard-header">
        <div className="team-info">
          <div className="team-score">Score: {team.score}</div>
        </div>
      </div>

      <div className="gameboard-content">
        <div className={`timer-display ${isLowTime ? 'low-time' : ''}`}>
          <div 
            className="timer-circle" 
            style={{ 
              backgroundImage: `conic-gradient(#667eea ${progressPercent * 3.6}deg, #f0f0f0 ${progressPercent * 3.6}deg)` 
            }}
          >
            <div className="timer-text">{timeString}</div>
          </div>
        </div>

        <div className="word-container">
          {gameContext.isPaused ? (
            <div className="word-display paused">
              ⏸ Ready for the next word?
            </div>
          ) : (
            <div className="word-display">
              {gameContext.currentWord}
            </div>
          )}
        </div>

        <div className="button-group">
          {gameContext.isPaused ? (
            <button className="action-button ready-button" onClick={handleReady}>
              ✓ Ready
            </button>
          ) : (
            <>
              <button className="action-button next-button" onClick={handleGotIt}>
                ✓ Got It!
              </button>
              <button className="action-button skip-button" onClick={handleSkip}>
                ⊘ Skip
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
