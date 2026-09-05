import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useI18n } from '../i18n/useI18n';
import { useGameTimer } from '../hooks/useGameTimer';
import { getActiveTeam, getTurnRoles, type GameState } from '../state/gameReducer';
import { formatClock } from '../utils/format';
import { teamColorVar } from '../utils/teamColor';
import { playCorrect, playFoul, playSkip, playTick, playTimeUp, primeAudio, vibrate } from '../utils/soundEffects';
import './GameBoard.css';

const RADIUS = 86;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type GameBoardProps = {
  game: GameState;
  onCorrect: (timeRemaining: number) => void;
  onSkip: (timeRemaining: number) => void;
  onFoul: (timeRemaining: number) => void;
  onTimeUp: () => void;
  onQuit: () => void;
};

function celebrate(streak: number) {
  confetti({
    particleCount: streak >= 3 ? 90 : 45,
    spread: streak >= 3 ? 90 : 62,
    startVelocity: 34,
    scalar: 0.9,
    origin: { y: 0.62 },
    colors: ['#fb923c', '#2dd4bf', '#34d399', '#fbbf24', '#a78bfa'],
    disableForReducedMotion: true,
  });
}

export function GameBoard({ game, onCorrect, onSkip, onFoul, onTimeUp, onQuit }: GameBoardProps) {
  const { t, n } = useI18n();
  const [paused, setPaused] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [flash, setFlash] = useState<'correct' | 'skip' | 'foul' | null>(null);
  const lastTickRef = useRef<number>(Number.POSITIVE_INFINITY);

  const team = getActiveTeam(game);
  const { describer, guesser } = getTurnRoles(game, team);
  const duration = game.mode === 'RELAY' ? (team?.remainingTime ?? game.turnDuration) : game.turnDuration;

  const handleTimeUp = useCallback(() => {
    playTimeUp();
    vibrate([30, 60, 30]);
    onTimeUp();
  }, [onTimeUp]);

  const timeRemaining = useGameTimer({
    duration,
    isActive: !paused && !confirmQuit,
    onEnd: handleTimeUp,
  });

  // Countdown ticks over the last few seconds.
  useEffect(() => {
    const whole = Math.ceil(timeRemaining);
    if (whole <= 5 && whole > 0 && whole !== lastTickRef.current) {
      lastTickRef.current = whole;
      playTick();
    }
  }, [timeRemaining]);

  // Losing the screen mid-turn would silently burn the clock, so pause instead.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const showFlash = (kind: 'correct' | 'skip' | 'foul') => {
    setFlash(kind);
    window.setTimeout(() => setFlash(null), 320);
  };

  const handleCorrect = useCallback(() => {
    if (paused || confirmQuit) return;
    primeAudio();
    playCorrect();
    vibrate(14);
    showFlash('correct');
    if ((team?.streak ?? 0) + 1 >= 2) celebrate((team?.streak ?? 0) + 1);
    onCorrect(timeRemaining);
  }, [confirmQuit, onCorrect, paused, team, timeRemaining]);

  const handleSkip = useCallback(() => {
    if (paused || confirmQuit) return;
    playSkip();
    vibrate(10);
    showFlash('skip');
    onSkip(timeRemaining);
  }, [confirmQuit, onSkip, paused, timeRemaining]);

  const handleFoul = useCallback(() => {
    if (paused || confirmQuit) return;
    playFoul();
    vibrate([18, 40, 18]);
    showFlash('foul');
    onFoul(timeRemaining);
  }, [confirmQuit, onFoul, paused, timeRemaining]);

  // Desktop shortcuts - handy when the phone is mirrored on a TV.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === ' ' || key === 'enter') {
        event.preventDefault();
        handleCorrect();
      } else if (key === 's') {
        handleSkip();
      } else if (key === 'f') {
        handleFoul();
      } else if (key === 'escape') {
        setPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCorrect, handleFoul, handleSkip]);

  const clocks = useMemo(() => {
    if (game.mode !== 'RELAY' || !team) return [];
    return [...game.teams]
      .map((item) => ({
        ...item,
        live: item.id === team.id ? timeRemaining : item.remainingTime,
      }))
      .sort((a, b) => b.live - a.live);
  }, [game.mode, game.teams, team, timeRemaining]);

  if (!team) return null;

  const progress = duration > 0 ? Math.max(0, Math.min(1, timeRemaining / duration)) : 0;
  const isLow = timeRemaining <= Math.min(10, duration * 0.25);

  return (
    <div
      className={`screen gameboard ${isLow ? 'low-time' : ''} ${flash ? `flash-${flash}` : ''} ${
        game.mode === 'SPRINT' ? 'sprint' : ''
      }`}
      style={teamColorVar(team.colorIndex)}
    >
      <header className="board-head">
        <button type="button" className="icon-btn" onClick={() => setConfirmQuit(true)} aria-label={t('game.quit')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="board-head-center">
          <span className="team-tag">
            <span className="team-dot" />
            {team.name}
          </span>
          {game.mode !== 'RELAY' && (
            <span className="round-pill small">{t('game.round', { n: game.currentRound, m: game.roundCount })}</span>
          )}
        </div>

        <button type="button" className="icon-btn" onClick={() => setPaused(true)} aria-label={t('game.pause')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M9 5v14M15 5v14" />
          </svg>
        </button>
      </header>

      <div className="board-roles">
        <strong>{describer?.name}</strong>
        <span aria-hidden="true">→</span>
        <strong>{guesser?.name}</strong>
      </div>

      <section className="timer-wrap">
        <svg className="timer-ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="ring-track" cx="100" cy="100" r={RADIUS} />
          <circle
            className="ring-progress"
            cx="100"
            cy="100"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="timer-inner">
          <span className="timer-value tabular">{formatClock(timeRemaining, n)}</span>
          <span className="timer-score tabular">
            {t('game.score')} {n(team.score)}
          </span>
        </div>
        {team.streak >= 2 && (
          <div className="streak-badge" key={team.streak}>
            🔥 {t('game.streak', { n: team.streak })}
          </div>
        )}
      </section>

      <section className="word-card" key={game.currentWord ?? 'none'}>
        {game.mode === 'SPRINT' && <span className="word-flag">{t('game.oneWord')}</span>}
        <span className="word-text">{game.currentWord ?? '…'}</span>
      </section>

      {game.mode === 'RELAY' && (
        <section className="clocks">
          <div className="clocks-head">{t('game.clocks')}</div>
          <div className="clocks-list">
            {clocks.map((item) => (
              <div
                className={`clock-row ${item.id === team.id ? 'active' : ''} ${item.eliminated ? 'out' : ''}`}
                key={item.id}
                style={teamColorVar(item.colorIndex)}
              >
                <span className="team-dot" />
                <span className="clock-name">{item.name}</span>
                <span className="clock-value tabular">
                  {item.eliminated ? t('game.out') : formatClock(item.live, n)}
                </span>
                <span className="clock-bar">
                  <span
                    className="clock-bar-fill"
                    style={{ width: `${Math.max(0, Math.min(100, (item.live / game.turnDuration) * 100))}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="board-actions">
        <button type="button" className="btn btn-success btn-lg btn-block correct-btn" onClick={handleCorrect}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m4 12.5 5.5 5.5L20 7" />
          </svg>
          {t('game.correct')}
        </button>
        <div className="secondary-actions">
          <button type="button" className="btn" onClick={handleSkip}>
            {t('game.skip')} <bdi className="cost" dir="ltr">−{n(1)}</bdi>
          </button>
          <button type="button" className="btn btn-danger" onClick={handleFoul} title={t('game.foul.full')}>
            {t('game.foul')}
          </button>
        </div>
        <p className="shortcut-hint">{t('game.shortcuts')}</p>
      </footer>

      {paused && (
        <div className="board-overlay">
          <div className="overlay-inner">
            <span className="overlay-icon" aria-hidden="true">⏸️</span>
            <h2>{t('game.paused')}</h2>
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => setPaused(false)}>
              {t('game.resume')}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirmQuit(true)}>
              {t('game.quit')}
            </button>
          </div>
        </div>
      )}

      {confirmQuit && (
        <div className="board-overlay">
          <div className="overlay-inner">
            <span className="overlay-icon" aria-hidden="true">🚪</span>
            <h2>{t('game.quit.confirm')}</h2>
            <button type="button" className="btn btn-danger btn-lg btn-block" onClick={onQuit}>
              {t('game.quit.yes')}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirmQuit(false)}>
              {t('game.quit.no')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
