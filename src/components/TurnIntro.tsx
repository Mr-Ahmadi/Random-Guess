import { useI18n } from '../i18n/useI18n';
import { getActiveTeam, getTurnRoles, type GameState } from '../state/gameReducer';
import { primeAudio, playReady, vibrate } from '../utils/soundEffects';
import { teamColorVar } from '../utils/teamColor';
import { formatClock } from '../utils/format';
import './TurnScreens.css';

type TurnIntroProps = {
  game: GameState;
  onReady: () => void;
  onQuit: () => void;
};

export function TurnIntro({ game, onReady, onQuit }: TurnIntroProps) {
  const { t, n } = useI18n();
  const team = getActiveTeam(game);
  const { describer, guesser } = getTurnRoles(game, team);

  if (!team) return null;

  const handleReady = () => {
    primeAudio();
    playReady();
    vibrate(12);
    onReady();
  };

  return (
    <div className="screen turn-screen" style={teamColorVar(team.colorIndex)}>
      <div className="turn-top">
        <button type="button" className="icon-btn" onClick={onQuit} aria-label={t('game.quit')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        {game.mode !== 'RELAY' && (
          <span className="round-pill">{t('game.round', { n: game.currentRound, m: game.roundCount })}</span>
        )}
        <span className="turn-top-spacer" />
      </div>

      <div className="turn-body">
        <span className="team-tag">
          <span className="team-dot" />
          {team.name}
        </span>

        {game.mode !== 'ROUNDS' && game.requireReadyAfterPass && (
          <p className="turn-kicker">{t('game.passPhone')}</p>
        )}

        <div className="handoff">
          <div className="handoff-person primary">
            <span className="handoff-avatar" aria-hidden="true">📣</span>
            <strong>{describer?.name}</strong>
            <span>{t('role.describer')}</span>
          </div>
          <div className="handoff-arrow" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
          <div className="handoff-person">
            <span className="handoff-avatar" aria-hidden="true">💡</span>
            <strong>{guesser?.name}</strong>
            <span>{t('role.guesser')}</span>
          </div>
        </div>

        {game.mode === 'RELAY' && (
          <p className="turn-kicker subtle">
            {t('game.clocks')} · {formatClock(team.remainingTime, n)}
          </p>
        )}

        <p className="muted turn-hint">{t('game.tapWhenReady')}</p>
      </div>

      <button type="button" className="btn btn-primary btn-lg btn-block ready-btn" onClick={handleReady}>
        {t('game.ready')}
      </button>
    </div>
  );
}
