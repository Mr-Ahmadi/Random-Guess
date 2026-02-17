import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { GameContext } from '../types/index';
import './GameOver.css';

type GameOverProps = {
  gameContext: GameContext;
  onRestartGame: () => void;
};

export function GameOver({ gameContext, onRestartGame }: GameOverProps) {
  const isSinglePhoneMode = gameContext.mode === 'SINGLE_PHONE';
  const team = gameContext.teams[gameContext.currentTeamIndex] ?? null;
  const rankedTeams = [...gameContext.teams].sort((a, b) => b.score - a.score);
  const winner = gameContext.winnerTeamId
    ? gameContext.teams.find((item) => item.id === gameContext.winnerTeamId) ?? null
    : rankedTeams[0] ?? null;

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
        colors: ['#f97316', '#14b8a6', '#22c55e'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f97316', '#14b8a6', '#f59e0b'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="gameover-container">
      <div className="gameover-card">
        <h1 className="gameover-title">🎉 Game Over!</h1>

        {!isSinglePhoneMode && team && (
          <div className="final-score">
            <p className="score-value">{team.score} {team.score === 1 ? 'point' : 'points'}</p>
            {team.bestStreak !== undefined && team.bestStreak > 0 && (
              <p className="best-streak">Best streak: {team.bestStreak} 🔥</p>
            )}
          </div>
        )}

        {isSinglePhoneMode && (
          <div className="final-score">
            {winner && (
              <p className="score-value">
                Winner: {winner.name} ({winner.score} {winner.score === 1 ? 'point' : 'points'})
              </p>
            )}
            <div className="scoreboard-list">
              {rankedTeams.map((player, index) => (
                <div className="scoreboard-item" key={player.id}>
                  <span className="rank">{index + 1}. {player.name}</span>
                  <span className="score">{player.score} {player.score === 1 ? 'pt' : 'pts'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="restart-button" onClick={onRestartGame}>
          Play Again
        </button>
      </div>
    </div>
  );
}
