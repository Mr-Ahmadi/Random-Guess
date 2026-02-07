import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { GameContext } from '../types/index';
import './GameOver.css';

type GameOverProps = {
  gameContext: GameContext;
  onRestartGame: () => void;
};

export function GameOver({ gameContext, onRestartGame }: GameOverProps) {
  const team = gameContext.team;

  useEffect(() => {
    // Big confetti celebration on game over
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#667eea', '#764ba2', '#10b981'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#667eea', '#764ba2', '#fbbf24'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="gameover-container">
      <div className="gameover-card">
        <h1 className="gameover-title">🎉 Game Over!</h1>

        {team && (
          <div className="final-score">
            <p className="score-value">{team.score} {team.score === 1 ? 'point' : 'points'}</p>
            {team.bestStreak !== undefined && team.bestStreak > 0 && (
              <p className="best-streak">Best streak: {team.bestStreak} 🔥</p>
            )}
          </div>
        )}

        <button className="restart-button" onClick={onRestartGame}>
          Play Again
        </button>
      </div>
    </div>
  );
}
