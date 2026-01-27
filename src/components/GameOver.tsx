import type { GameContext } from '../types/index';
import './GameOver.css';

type GameOverProps = {
  gameContext: GameContext;
  onRestartGame: () => void;
};

export function GameOver({ gameContext, onRestartGame }: GameOverProps) {
  const team = gameContext.team;

  return (
    <div className="gameover-container">
      <div className="gameover-card">
        <h1 className="gameover-title">🎉 Game Over!</h1>

        {team && (
          <div className="final-score">
            <p className="score-value">{team.score} {team.score === 1 ? 'point' : 'points'}</p>
          </div>
        )}

        <button className="restart-button" onClick={onRestartGame}>
          Play Again
        </button>
      </div>
    </div>
  );
}
