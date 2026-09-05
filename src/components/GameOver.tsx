import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useI18n } from '../i18n/useI18n';
import type { GameState } from '../state/gameReducer';
import { formatClock } from '../utils/format';
import { teamColorVar } from '../utils/teamColor';
import { playFanfare } from '../utils/soundEffects';
import './GameOver.css';

type GameOverProps = {
  game: GameState;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
};

const MEDALS = ['🥇', '🥈', '🥉'];

export function GameOver({ game, onPlayAgain, onBackToLobby }: GameOverProps) {
  const { t, n } = useI18n();

  const ranked = useMemo(() => {
    return [...game.teams].sort((a, b) => {
      if (game.mode === 'RELAY') {
        if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
        if (b.remainingTime !== a.remainingTime) return b.remainingTime - a.remainingTime;
      }
      if (b.score !== a.score) return b.score - a.score;
      return b.correct - a.correct;
    });
  }, [game.mode, game.teams]);

  const winners = game.teams.filter((team) => game.winnerTeamIds.includes(team.id));

  useEffect(() => {
    playFanfare();
    const end = Date.now() + 2200;
    let frame = 0;
    const shoot = () => {
      confetti({
        particleCount: 4,
        angle: 62,
        spread: 60,
        origin: { x: 0, y: 0.72 },
        colors: ['#fb923c', '#2dd4bf', '#34d399'],
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 4,
        angle: 118,
        spread: 60,
        origin: { x: 1, y: 0.72 },
        colors: ['#a78bfa', '#fbbf24', '#f472b6'],
        disableForReducedMotion: true,
      });
      if (Date.now() < end) frame = requestAnimationFrame(shoot);
    };
    shoot();
    return () => cancelAnimationFrame(frame);
  }, []);

  const winnerLabel = winners.length === 1
    ? t('over.winner', { team: winners[0].name })
    : t('over.tie');

  return (
    <div className="screen gameover" style={teamColorVar(winners[0]?.colorIndex ?? 0)}>
      <div className="over-head">
        <span className="over-trophy" aria-hidden="true">🏆</span>
        <p className="over-kicker">{t('over.title')}</p>
        <h2 className="over-winner">{winnerLabel}</h2>
      </div>

      <div className="screen-scroll">
        <section className="card">
          <div className="card-title">{t('over.standings')}</div>
          <div className="over-list">
            {ranked.map((team, index) => (
              <div
                className={`over-row ${index === 0 ? 'leader' : ''} ${team.eliminated ? 'out' : ''}`}
                key={team.id}
                style={teamColorVar(team.colorIndex)}
              >
                <span className="over-rank">{MEDALS[index] ?? n(index + 1)}</span>
                <span className="over-team">
                  <span className="over-team-name">{team.name}</span>
                  <span className="over-team-meta">
                    ✅ {n(team.correct)} · ↺ {n(team.skipped)} · ⚠️ {n(team.fouls)}
                    {team.bestStreak > 1 ? ` · 🔥 ${n(team.bestStreak)}` : ''}
                  </span>
                </span>
                <span className="over-score">
                  <strong className="tabular">{n(team.score)}</strong>
                  <span>
                    {game.mode === 'RELAY'
                      ? `${formatClock(team.remainingTime, n)} ${t('over.timeLeft')}`
                      : t('over.points')}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="over-punishment">{t('over.punishment')}</p>
      </div>

      <div className="over-actions">
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onPlayAgain}>
          {t('over.again')}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onBackToLobby}>
          {t('over.lobby')}
        </button>
      </div>
    </div>
  );
}
