import { useEffect } from 'react';
import { useI18n } from '../i18n/useI18n';
import type { GameState } from '../state/gameReducer';
import { formatClock, formatSigned } from '../utils/format';
import { teamColorVar } from '../utils/teamColor';
import { playTimeUp, vibrate } from '../utils/soundEffects';
import './TurnScreens.css';

type TurnSummaryProps = {
  game: GameState;
  onContinue: () => void;
};

export function TurnSummary({ game, onContinue }: TurnSummaryProps) {
  const { t, n } = useI18n();
  const stats = game.lastTurn;
  const team = game.teams.find((item) => item.id === stats?.teamId) ?? null;

  useEffect(() => {
    playTimeUp();
    vibrate([28, 60, 28]);
  }, []);

  if (!stats || !team) return null;

  const isLastTeamOfRound = game.activeTeamIndex >= game.teams.length - 1;
  const aliveTeams = game.teams.filter((item) => !item.eliminated);

  const nextLabel = (() => {
    if (game.mode === 'RELAY') {
      if (aliveTeams.length <= 1) return t('turn.finish');
      const nextIndex = findNextAlive(game, game.activeTeamIndex);
      return t('turn.nextTeam', { team: game.teams[nextIndex]?.name ?? '' });
    }
    if (isLastTeamOfRound) {
      return game.currentRound >= game.roundCount
        ? t('turn.finish')
        : t('turn.nextRound', { n: game.currentRound + 1 });
    }
    return t('turn.nextTeam', { team: game.teams[game.activeTeamIndex + 1]?.name ?? '' });
  })();

  return (
    <div className="screen turn-screen summary" style={teamColorVar(team.colorIndex)}>
      <div className="turn-body">
        <p className="summary-flash">{stats.eliminated ? t('turn.eliminated', { team: team.name }) : t('turn.timeUp')}</p>

        <span className="team-tag">
          <span className="team-dot" />
          {team.name}
        </span>

        <div className={`summary-points ${stats.points < 0 ? 'negative' : ''}`}>
          <strong className="tabular" dir="ltr">{formatSigned(stats.points, n)}</strong>
          <span>{t('turn.points')}</span>
        </div>

        <div className="summary-grid">
          <div className="summary-stat good">
            <strong className="tabular">{n(stats.correct)}</strong>
            <span>{t('turn.correct')}</span>
          </div>
          <div className="summary-stat">
            <strong className="tabular">{n(stats.skipped)}</strong>
            <span>{t('turn.skipped')}</span>
          </div>
          <div className="summary-stat bad">
            <strong className="tabular">{n(stats.fouls)}</strong>
            <span>{t('turn.fouls')}</span>
          </div>
          <div className="summary-stat">
            <strong className="tabular">{n(stats.bestStreak)}</strong>
            <span>{t('turn.best')}</span>
          </div>
        </div>

        <div className="summary-standings">
          {[...game.teams]
            .sort((a, b) => (game.mode === 'RELAY' ? b.remainingTime - a.remainingTime : b.score - a.score))
            .map((item) => (
              <div className={`standing-row ${item.eliminated ? 'out' : ''}`} key={item.id} style={teamColorVar(item.colorIndex)}>
                <span className="team-dot" />
                <span className="standing-name">{item.name}</span>
                <span className="standing-value tabular">
                  {game.mode === 'RELAY'
                    ? (item.eliminated ? t('game.out') : formatClock(item.remainingTime, n))
                    : n(item.score)}
                </span>
              </div>
            ))}
        </div>
      </div>

      <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onContinue}>
        {nextLabel}
      </button>
    </div>
  );
}

function findNextAlive(game: GameState, fromIndex: number): number {
  for (let offset = 1; offset <= game.teams.length; offset += 1) {
    const candidate = (fromIndex + offset) % game.teams.length;
    if (!game.teams[candidate].eliminated) return candidate;
  }
  return fromIndex;
}
