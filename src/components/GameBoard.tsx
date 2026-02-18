import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { GameContext } from '../types/index';
import { useGameTimer } from '../hooks/useGameTimer';
import { playReadyBeep, playGotItBeep, playSkipBeep, playTimeEndedBeep } from '../utils/soundEffects';
import './GameBoard.css';

function fireConfetti() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#f97316', '#14b8a6', '#22c55e', '#f59e0b'],
  });
}

function hapticLight() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

function formatSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

type GameBoardProps = {
  gameContext: GameContext;
  onNextWord: (timeRemaining?: number) => void;
  onSkipWord: (timeRemaining?: number) => void;
  onReady: () => void;
  onPause: () => void;
  onExit: () => void;
  onTimerEnd: (timeRemaining?: number) => void;
};

export function GameBoard({
  gameContext,
  onNextWord,
  onSkipWord,
  onReady,
  onPause,
  onExit,
  onTimerEnd
}: GameBoardProps) {
  const isSinglePhoneMode = gameContext.mode === 'SINGLE_PHONE';
  const currentPlayer = isSinglePhoneMode ? gameContext.players[gameContext.currentPlayerIndex] : null;
  const activeTeam = isSinglePhoneMode
    ? gameContext.teams.find((team) => team.id === currentPlayer?.teamId) ?? null
    : gameContext.teams[gameContext.currentTeamIndex] ?? null;

  const teammates = isSinglePhoneMode && activeTeam
    ? gameContext.players.filter((player) => activeTeam.memberIds?.includes(player.id))
    : [];
  const teammateName = teammates.find((player) => player.id !== currentPlayer?.id)?.name ?? null;

  const isPassPhonePause = gameContext.isPaused && gameContext.pauseReason === 'PASS_PHONE';
  const activeDuration = Math.max(0, activeTeam?.remainingTime ?? gameContext.timerDuration);
  const initialTeamDuration = Math.max(0, gameContext.timerDuration);

  const timeRemaining = useGameTimer({
    duration: activeDuration,
    isActive: !gameContext.isPaused && gameContext.state === 'IN_GAME',
    onTimerEnd: useCallback(() => {
      playTimeEndedBeep();
      onTimerEnd(0);
    }, [onTimerEnd]),
  });

  const timeString = formatSeconds(timeRemaining);
  const progressPercent = activeDuration > 0 ? (timeRemaining / activeDuration) : 0;
  const isLowTime = timeRemaining < activeDuration * 0.2;

  const getNextEligiblePlayer = () => {
    if (!isSinglePhoneMode || gameContext.players.length === 0) return null;
    const teamById = new Map(gameContext.teams.map((team) => [team.id, team]));
    const startIndex = gameContext.currentPlayerIndex;
    const totalPlayers = gameContext.players.length;

    for (let offset = 1; offset <= totalPlayers; offset += 1) {
      const candidateIndex = (startIndex + offset) % totalPlayers;
      const candidate = gameContext.players[candidateIndex];
      const candidateTeam = teamById.get(candidate.teamId);
      if (candidateTeam && !candidateTeam.eliminated) {
        return { player: candidate, team: candidateTeam };
      }
    }
    return null;
  };

  if (!activeTeam) return null;

  const nextEligible = getNextEligiblePlayer();

  const teamTimeRows = gameContext.teams
    .map((team) => {
      const baseRemaining = team.id === activeTeam.id ? timeRemaining : (team.remainingTime ?? initialTeamDuration);
      const remaining = Math.max(0, baseRemaining);
      return {
        ...team,
        remaining,
        percent: initialTeamDuration > 0 ? (remaining / initialTeamDuration) * 100 : 0,
        isActive: team.id === activeTeam.id,
      };
    })
    .sort((a, b) => b.remaining - a.remaining);

  const handleReady = () => {
    playReadyBeep();
    hapticLight();
    onReady();
  };

  const handleGotIt = () => {
    playGotItBeep();
    hapticLight();
    const streak = activeTeam?.streak ?? 0;
    if (streak >= 1) fireConfetti();
    onNextWord(timeRemaining);
  };

  const handleSkip = () => {
    playSkipBeep();
    hapticLight();
    onSkipWord(timeRemaining);
  };

  // SVG dimensions for circular progress
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progressPercent * circumference;

  return (
    <div className="gameboard-container">
      {/* Pass Phone / Pause Overlay */}
      {gameContext.isPaused && (
        <div className="pass-phone-overlay">
          {isPassPhonePause && currentPlayer ? (
            <>
              <div className="pass-phone-title">PASS PHONE</div>
              <div className="pass-phone-player">{currentPlayer.name}</div>
              <div className="pass-phone-hint">... THEN TAP READY</div>
            </>
          ) : (
            <>
              <div className="pass-phone-title">Game Paused</div>
              <div className="pass-phone-player">PAUSED</div>
              <div className="pass-phone-hint">Tap Ready to Resume</div>
            </>
          )}
          <div style={{ marginTop: '2rem', width: 'min(300px, 100%)' }}>
            <button className="btn-game btn-ready" onClick={handleReady}>Ready</button>
          </div>
        </div>
      )}

      <header className="gameboard-header">
        <div className="header-controls">
          <button className="icon-button" onClick={onExit} title="Back to Lobby">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          {!gameContext.isPaused && (
            <button className="icon-button" onClick={onPause} title="Pause Game">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            </button>
          )}
        </div>

        <div className="team-info">
          <div className="team-score">
            {isSinglePhoneMode ? (
              <span>{currentPlayer?.name} is Playing {teammateName ? `• For ${teammateName}` : ''}</span>
            ) : (
              <span>{activeTeam.name} • Score: {activeTeam.score}</span>
            )}
          </div>
        </div>

        {isSinglePhoneMode && nextEligible ? (
          <div className="team-info" style={{ opacity: 0.8, transform: 'scale(0.9)' }}>
            <div className="team-score" style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
              Next Player: {nextEligible.player.name}
            </div>
          </div>
        ) : <div style={{ width: 48 }} />}
      </header>

      <main className="gameboard-content">
        <section className="timer-section">
          <div className={`timer-display ${isLowTime ? 'low-time' : ''}`}>
            <svg className="timer-svg" viewBox="0 0 200 200">
              <circle className="timer-circle-bg" cx="100" cy="100" r={radius} />
              <circle
                className="timer-circle-progress"
                cx="100"
                cy="100"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="timer-text">{timeString}</div>
          </div>
          {activeTeam.streak !== undefined && activeTeam.streak > 0 && (
            <div className="team-streak-badge">
              🔥 {activeTeam.streak} Streak
            </div>
          )}
        </section>

        <section className="word-section">
          <div className="word-card">
            <div className="word-display">
              {gameContext.currentWord || '...'}
            </div>
          </div>
        </section>

        {isSinglePhoneMode && (
          <section className="team-clocks-card">
            <div className="clocks-title">Team Clocks</div>
            <div className="clocks-grid">
              {teamTimeRows.map((team) => (
                <div className={`clock-row ${team.isActive ? 'active' : ''}`} key={team.id}>
                  <div className="clock-team-name">{team.name}</div>
                  <div className="clock-time-info">
                    <span className="clock-remaining">{formatSeconds(team.remaining)}</span>
                    <span className="clock-total">/ {formatSeconds(initialTeamDuration)}</span>
                    <div className="clock-progress-bar">
                      <div
                        className="clock-progress-fill"
                        style={{ width: `${team.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!gameContext.isPaused && (
          <section className="game-actions">
            <button className="btn-game btn-got-it" onClick={handleGotIt}>Got It</button>
            <button className="btn-game btn-skip" onClick={handleSkip}>Skip</button>
          </section>
        )}
      </main>
    </div>
  );
}
