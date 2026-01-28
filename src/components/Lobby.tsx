import { useState } from 'react';
import { Logo } from './Logo';
import './Lobby.css';

interface LobbyProps {
  onStartGame: (teamName: string, timerDuration: number) => void;
}

export function Lobby({ onStartGame }: LobbyProps) {
  const [timerDuration, setTimerDuration] = useState(60);

  const handleStartGame = () => {
    onStartGame('Player', timerDuration);
  };

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <div className="lobby-logo-section">
          <Logo size="lg" />
        </div>
        <h1 className="lobby-title">Word Guess</h1>
        <p className="lobby-subtitle">How many words can you guess?</p>

        <div className="form-group">
          <label htmlFor="timer-duration">Timer Duration (seconds)</label>
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
              onChange={(e) => setTimerDuration(Math.max(10, parseInt(e.target.value) || 60))}
              min="10"
              max="300"
            />
          </div>
        </div>

        <button className="start-button" onClick={handleStartGame}>
          Start Game
        </button>
      </div>
    </div>
  );
}
