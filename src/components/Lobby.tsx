import { useState, type CSSProperties } from 'react';
import { Logo } from './Logo';
import type { GameMode } from '../types';
import './Lobby.css';

interface LobbyProps {
  onStartGame: (
    mode: GameMode,
    names: string[],
    timerDuration: number,
    requireReadyAfterPass: boolean
  ) => void;
  wordsLoading?: boolean;
  wordsReady?: boolean;
}

export function Lobby({ onStartGame, wordsLoading = false, wordsReady = true }: LobbyProps) {
  const [mode, setMode] = useState<GameMode>('MULTI_PHONE');
  const [timerDuration, setTimerDuration] = useState(60);
  const [playersInput, setPlayersInput] = useState('Player 1\nPlayer 2\nPlayer 3\nPlayer 4');
  const [requireReadyAfterPass, setRequireReadyAfterPass] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const parsedPlayers = playersInput
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  const hasEvenPlayers = parsedPlayers.length % 2 === 0;
  const canStartSinglePhone = parsedPlayers.length >= 4 && hasEvenPlayers;
  const half = Math.floor(parsedPlayers.length / 2);
  const teamPreview = hasEvenPlayers
    ? Array.from({ length: half }, (_, index) => ({
      left: parsedPlayers[index],
      right: parsedPlayers[index + half],
    }))
    : [];
  const getTeamColorStyle = (index: number) => (
    { '--team-color': `var(--team-color-${(index % 6) + 1})` } as CSSProperties
  );

  const handleStartGame = () => {
    if (mode === 'SINGLE_PHONE') {
      if (!canStartSinglePhone) return;
      onStartGame(mode, parsedPlayers, timerDuration, requireReadyAfterPass);
      return;
    }

    onStartGame(mode, ['Team 1'], timerDuration, true);
  };

  return (
    <div className="lobby-container">
      <div className={`lobby-card ${mode === 'SINGLE_PHONE' ? 'single-phone' : ''}`}>
        <div className="lobby-logo-section">
          <Logo size="lg" />
        </div>
        <h1 className="lobby-title">Word Guess</h1>
        <p className="lobby-subtitle">How many words can you guess?</p>

        <div className="form-group">
          <label>Game Mode</label>
          <div className="mode-controls">
            <button
              className={`mode-btn ${mode === 'MULTI_PHONE' ? 'active' : ''}`}
              onClick={() => setMode('MULTI_PHONE')}
              title="Play with a separate phone per team"
            >
              Multi-phone
            </button>
            <button
              className={`mode-btn ${mode === 'SINGLE_PHONE' ? 'active' : ''}`}
              onClick={() => setMode('SINGLE_PHONE')}
              title="Pass one phone around players"
            >
              Single-phone
            </button>
          </div>
        </div>

        {mode === 'SINGLE_PHONE' && (
          <div className="form-group">
            <div className="label-with-hint">
              <label htmlFor="players">Players (one per line)</label>
              <button
                type="button"
                className={`players-hint ${canStartSinglePhone ? 'interactive' : 'error'}`}
                onClick={() => canStartSinglePhone && setShowTeamModal(true)}
                disabled={!canStartSinglePhone}
              >
                {canStartSinglePhone
                  ? `${parsedPlayers.length} players ready • View Teams`
                  : 'Enter even number of players (min 4)'}
              </button>
            </div>
            <textarea
              id="players"
              className="players-textarea"
              value={playersInput}
              onChange={(e) => setPlayersInput(e.target.value)}
              rows={3}
              placeholder="Player 1&#10;Player 2&#10;Player 3&#10;Player 4"
            />
            <label className="pass-option">
              <input
                type="checkbox"
                className="pass-option-input"
                checked={requireReadyAfterPass}
                onChange={(e) => setRequireReadyAfterPass(e.target.checked)}
              />
              <span className="pass-option-copy">
                <strong>Show pass-phone pause screen</strong>
                {/* <span>Pause between turns to pass the device.</span> */}
              </span>
              <span className="pass-option-state" aria-hidden="true">
                {requireReadyAfterPass ? 'On' : 'Off'}
              </span>
            </label>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="timer-duration">Timer Per Team (seconds)</label>
          <div className="timer-controls">
            <button
              className={`timer-preset-btn ${timerDuration === 30 ? 'active' : ''}`}
              onClick={() => setTimerDuration(30)}
              title="30 seconds"
            >
              30s
            </button>
            <button
              className={`timer-preset-btn ${timerDuration === 60 ? 'active' : ''}`}
              onClick={() => setTimerDuration(60)}
              title="60 seconds"
            >
              60s
            </button>
            <button
              className={`timer-preset-btn ${timerDuration === 90 ? 'active' : ''}`}
              onClick={() => setTimerDuration(90)}
              title="90 seconds"
            >
              90s
            </button>
            <input
              id="timer-duration"
              type="number"
              className="timer-input"
              value={timerDuration}
              onChange={(e) => setTimerDuration(Math.max(10, parseInt(e.target.value, 10) || 60))}
              min="10"
              max="300"
            />
          </div>
        </div>

        <button
          className="start-button"
          onClick={handleStartGame}
          disabled={wordsLoading || !wordsReady || (mode === 'SINGLE_PHONE' && !canStartSinglePhone)}
          aria-busy={wordsLoading}
        >
          {wordsLoading ? 'Loading words…' : 'Start Game'}
        </button>
      </div>

      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Team Pairings</h2>
              <button
                className="modal-close"
                onClick={() => setShowTeamModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="modal-content">
              <div className="team-preview grid">
                {teamPreview.map((team, index) => (
                  <div className="team-preview-row" key={`${team.left}-${team.right}`}>
                    <span className="team-player-pill" style={getTeamColorStyle(index)}>
                      {team.left}
                    </span>
                    <span className="team-link" aria-hidden="true">+</span>
                    <span className="team-player-pill" style={getTeamColorStyle(index)}>
                      {team.right}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button className="modal-action-btn" onClick={() => setShowTeamModal(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
