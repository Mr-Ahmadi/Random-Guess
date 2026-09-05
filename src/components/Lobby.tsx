import { useEffect, useMemo, useState } from 'react';
import { TopBar } from './TopBar';
import { RulesModal } from './RulesModal';
import { useI18n } from '../i18n/useI18n';
import type { Language, TranslationKey } from '../i18n/strings';
import { buildWordPool, loadWordPacks, shuffle, type WordPacks } from '../data/wordLoader';
import type { GameMode, StartGamePayload, TeamDraft } from '../types/index';
import { TEAM_COLOR_COUNT } from '../state/gameReducer';
import { primeAudio, playReady } from '../utils/soundEffects';
import './Lobby.css';

const MAX_TEAMS = 10;
const MIN_TEAMS = 2;
const SETUP_KEY = 'dowr.setup';

const ROUND_TIMES = [10, 15, 30, 60, 90, 120];
const BANK_TIMES = [10, 15, 60, 90, 120, 180];
const SPRINT_TIMES = [5, 10, 15, 20, 30, 45];
const MIN_DURATION = 5;
const MAX_DURATION = 300;
const ROUND_COUNTS = [2, 3, 4, 5];

const MODE_OPTIONS: { id: GameMode; icon: string; nameKey: TranslationKey; descKey: TranslationKey }[] = [
  { id: 'ROUNDS', icon: '🎯', nameKey: 'lobby.mode.rounds', descKey: 'lobby.mode.rounds.desc' },
  { id: 'RELAY', icon: '⏳', nameKey: 'lobby.mode.relay', descKey: 'lobby.mode.relay.desc' },
  { id: 'SPRINT', icon: '⚡', nameKey: 'lobby.mode.sprint', descKey: 'lobby.mode.sprint.desc' },
];

type StoredSetup = {
  mode: GameMode;
  roundCount: number;
  roundDuration: number;
  bankDuration: number;
  sprintDuration: number;
  /** RELAY: pause on the hand-off screen between turns. */
  requireReadyAfterPass: boolean;
  /** SPRINT: off means the phone switches teams with no screen in between. */
  sprintPassScreen: boolean;
  teamDrafts: TeamDraft[];
};

function makeTeam(index: number): TeamDraft {
  return { id: `draft-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`, playerNames: ['', ''] };
}

function defaultSetup(): StoredSetup {
  return {
    mode: 'ROUNDS',
    roundCount: 3,
    roundDuration: 60,
    bankDuration: 120,
    sprintDuration: 15,
    requireReadyAfterPass: true,
    sprintPassScreen: false,
    teamDrafts: [makeTeam(0), makeTeam(1)],
  };
}

function readSetup(): StoredSetup {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    if (!raw) return defaultSetup();
    const parsed = JSON.parse(raw) as Partial<StoredSetup>;
    const base = defaultSetup();
    const drafts = Array.isArray(parsed.teamDrafts) && parsed.teamDrafts.length >= MIN_TEAMS
      ? parsed.teamDrafts.slice(0, MAX_TEAMS).map((draft, index) => ({
          id: draft?.id ?? makeTeam(index).id,
          playerNames: [draft?.playerNames?.[0] ?? '', draft?.playerNames?.[1] ?? ''] as [string, string],
        }))
      : base.teamDrafts;

    return { ...base, ...parsed, teamDrafts: drafts };
  } catch {
    return defaultSetup();
  }
}

type LobbyProps = {
  onStartGame: (payload: StartGamePayload) => void;
};

export function Lobby({ onStartGame }: LobbyProps) {
  const { t, n, lang } = useI18n();

  const [setup, setSetup] = useState<StoredSetup>(readSetup);
  const [wordLanguage, setWordLanguage] = useState<Language>(lang);
  const [packs, setPacks] = useState<WordPacks>({});
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [packsLoading, setPacksLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);

  const { mode, teamDrafts, roundCount, requireReadyAfterPass, sprintPassScreen } = setup;
  const duration = mode === 'ROUNDS'
    ? setup.roundDuration
    : mode === 'RELAY'
      ? setup.bankDuration
      : setup.sprintDuration;

  // Word language follows the interface language unless the player overrides it.
  useEffect(() => {
    setWordLanguage(lang);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    setPacksLoading(true);
    loadWordPacks(wordLanguage)
      .then((loaded) => {
        if (cancelled) return;
        setPacks(loaded);
        setSelectedPacks(Object.keys(loaded));
      })
      .finally(() => {
        if (!cancelled) setPacksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wordLanguage]);

  useEffect(() => {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setup));
    } catch {
      // storage unavailable - settings simply will not persist
    }
  }, [setup]);

  const patch = (next: Partial<StoredSetup>) => setSetup((prev) => ({ ...prev, ...next }));

  const setDuration = (seconds: number) => {
    if (mode === 'ROUNDS') patch({ roundDuration: seconds });
    else if (mode === 'RELAY') patch({ bankDuration: seconds });
    else patch({ sprintDuration: seconds });
  };

  const playerCount = teamDrafts.length * 2;
  const poolSize = useMemo(
    () => selectedPacks.reduce((total, name) => total + (packs[name]?.length ?? 0), 0),
    [packs, selectedPacks]
  );

  const updateName = (teamIndex: number, memberIndex: 0 | 1, value: string) => {
    setSetup((prev) => ({
      ...prev,
      teamDrafts: prev.teamDrafts.map((draft, index) => {
        if (index !== teamIndex) return draft;
        const playerNames: [string, string] = [...draft.playerNames] as [string, string];
        playerNames[memberIndex] = value;
        return { ...draft, playerNames };
      }),
    }));
  };

  const addTeam = () => {
    if (teamDrafts.length >= MAX_TEAMS) return;
    patch({ teamDrafts: [...teamDrafts, makeTeam(teamDrafts.length)] });
  };

  const removeTeam = (teamIndex: number) => {
    if (teamDrafts.length <= MIN_TEAMS) return;
    patch({ teamDrafts: teamDrafts.filter((_, index) => index !== teamIndex) });
  };

  const shuffleTeams = () => {
    const names = shuffle(teamDrafts.flatMap((draft) => draft.playerNames));
    patch({
      teamDrafts: teamDrafts.map((draft, index) => ({
        ...draft,
        playerNames: [names[index * 2] ?? '', names[index * 2 + 1] ?? ''] as [string, string],
      })),
    });
  };

  const togglePack = (name: string) => {
    setSelectedPacks((prev) => (
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    ));
  };

  const packLabel = (name: string) => {
    const key = `cat.${name}` as TranslationKey;
    const label = t(key);
    return label === key ? name : label;
  };

  const handleStart = () => {
    if (teamDrafts.length < MIN_TEAMS) {
      setError('lobby.error.teams');
      return;
    }
    if (selectedPacks.length === 0 || poolSize === 0) {
      setError('lobby.error.categories');
      return;
    }

    const safeDuration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, duration));

    let seat = 0;
    const filledDrafts: TeamDraft[] = teamDrafts.map((draft) => ({
      ...draft,
      playerNames: draft.playerNames.map((name) => {
        seat += 1;
        return name.trim() || t('player.default', { n: seat });
      }) as [string, string],
    }));

    primeAudio();
    playReady();
    setError(null);
    onStartGame({
      mode,
      wordLanguage,
      teamDrafts: filledDrafts,
      roundCount,
      turnDuration: safeDuration,
      requireReadyAfterPass: mode === 'SPRINT' ? sprintPassScreen : requireReadyAfterPass,
      wordPool: buildWordPool(packs, selectedPacks),
    });
  };

  const durationPresets = mode === 'ROUNDS' ? ROUND_TIMES : mode === 'RELAY' ? BANK_TIMES : SPRINT_TIMES;
  const isCustomDuration = !durationPresets.includes(duration);

  const durationLabel = mode === 'ROUNDS'
    ? t('lobby.turnTime')
    : mode === 'RELAY'
      ? t('lobby.timeBank')
      : t('lobby.wordTime');

  return (
    <div className="screen lobby">
      <TopBar
        extra={
          <button type="button" className="icon-btn" onClick={() => setShowRules(true)} title={t('lobby.rules')} aria-label={t('lobby.rules')}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.6 9a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4" />
              <path d="M12 17h.01" />
            </svg>
          </button>
        }
      />

      <div className="screen-scroll">
        <section className="card mode-card">
          <div className="card-title">{t('lobby.mode')}</div>
          <div className="mode-grid">
            {MODE_OPTIONS.map(({ id, icon, nameKey, descKey }) => (
              <button
                key={id}
                type="button"
                className={`mode-option ${mode === id ? 'active' : ''}`}
                onClick={() => patch({ mode: id })}
                aria-pressed={mode === id}
              >
                <span className="mode-icon" aria-hidden="true">{icon}</span>
                <span className="mode-name">{t(nameKey)}</span>
                <span className="mode-desc">{t(descKey)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-title">
            <span>{t('lobby.teams')}</span>
            <span className="teams-count">{t('lobby.players.count', { n: playerCount, t: teamDrafts.length })}</span>
          </div>
          <p className="muted teams-hint">{t('lobby.teams.hint')}</p>

          <div className="team-list">
            {teamDrafts.map((draft, index) => (
              <div
                className="team-row"
                key={draft.id}
                style={{ ['--team-color' as string]: `var(--team-${(index % TEAM_COLOR_COUNT) + 1})` }}
              >
                <div className="team-row-head">
                  <span className="team-dot" />
                  <span className="team-row-name">{t('lobby.team', { n: index + 1 })}</span>
                  <button
                    type="button"
                    className="team-remove"
                    onClick={() => removeTeam(index)}
                    disabled={teamDrafts.length <= MIN_TEAMS}
                    aria-label={t('lobby.removeTeam')}
                    title={t('lobby.removeTeam')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="team-inputs">
                  <input
                    className="name-input"
                    value={draft.playerNames[0]}
                    onChange={(event) => updateName(index, 0, event.target.value)}
                    placeholder={t('player.default', { n: index * 2 + 1 })}
                    aria-label={t('lobby.player1')}
                    maxLength={18}
                  />
                  <span className="team-amp" aria-hidden="true">+</span>
                  <input
                    className="name-input"
                    value={draft.playerNames[1]}
                    onChange={(event) => updateName(index, 1, event.target.value)}
                    placeholder={t('player.default', { n: index * 2 + 2 })}
                    aria-label={t('lobby.player2')}
                    maxLength={18}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="team-actions">
            <button type="button" className="btn btn-ghost" onClick={addTeam} disabled={teamDrafts.length >= MAX_TEAMS}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t('lobby.addTeam')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={shuffleTeams}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
              {t('lobby.shuffle')}
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-title">{t('lobby.setup')}</div>

          <div className="stack">
            {mode !== 'RELAY' && (
              <div className="field">
                <label>{t('lobby.rounds')}</label>
                <div className="segmented compact">
                  {ROUND_COUNTS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={roundCount === count ? 'active' : ''}
                      onClick={() => patch({ roundCount: count })}
                    >
                      {n(count)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <label>{durationLabel}</label>
              <div className="chip-row">
                {durationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`chip ${duration === preset ? 'active' : ''}`}
                    onClick={() => setDuration(preset)}
                    aria-pressed={duration === preset}
                  >
                    {preset % 60 === 0 && preset >= 60
                      ? t('minutes.short', { n: preset / 60 })
                      : t('seconds.short', { n: preset })}
                  </button>
                ))}
                <span className={`chip custom-time ${isCustomDuration ? 'active' : ''}`}>
                  <span className="custom-time-label">{t('lobby.custom')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={MIN_DURATION}
                    max={MAX_DURATION}
                    value={duration}
                    onChange={(event) => {
                      const parsed = Number.parseInt(event.target.value, 10);
                      if (Number.isNaN(parsed)) return;
                      setDuration(Math.min(MAX_DURATION, Math.max(1, parsed)));
                    }}
                    onBlur={() => setDuration(Math.min(MAX_DURATION, Math.max(MIN_DURATION, duration)))}
                    aria-label={durationLabel}
                  />
                  <span className="custom-time-unit">{t('lobby.custom.unit')}</span>
                </span>
              </div>
            </div>

            {mode === 'RELAY' && (
              <label className="toggle-row">
                <span className="toggle-copy">
                  <strong>{t('lobby.passScreen')}</strong>
                  <span>{t('lobby.passScreen.desc')}</span>
                </span>
                <span className={`toggle ${requireReadyAfterPass ? 'on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={requireReadyAfterPass}
                    onChange={(event) => patch({ requireReadyAfterPass: event.target.checked })}
                  />
                </span>
              </label>
            )}

            {mode === 'SPRINT' && (
              <label className="toggle-row">
                <span className="toggle-copy">
                  <strong>{t('lobby.instantSwitch')}</strong>
                  <span>{t('lobby.instantSwitch.desc')}</span>
                </span>
                <span className={`toggle ${!sprintPassScreen ? 'on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={!sprintPassScreen}
                    onChange={(event) => patch({ sprintPassScreen: !event.target.checked })}
                  />
                </span>
              </label>
            )}

            <div className="field">
              <label>{t('lobby.wordLang')}</label>
              <div className="segmented compact">
                <button type="button" className={wordLanguage === 'en' ? 'active' : ''} onClick={() => setWordLanguage('en')}>
                  English
                </button>
                <button type="button" className={wordLanguage === 'fa' ? 'active' : ''} onClick={() => setWordLanguage('fa')}>
                  فارسی
                </button>
              </div>
            </div>

            <div className="field">
              <label>
                {t('lobby.categories')}
                <span className="pool-size">{n(poolSize)}</span>
              </label>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${selectedPacks.length === Object.keys(packs).length ? 'active' : ''}`}
                  onClick={() => setSelectedPacks(Object.keys(packs))}
                >
                  {t('lobby.categories.all')}
                </button>
                {Object.keys(packs).map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`chip ${selectedPacks.includes(name) ? 'active' : ''}`}
                    onClick={() => togglePack(name)}
                    aria-pressed={selectedPacks.includes(name)}
                  >
                    {packLabel(name)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <button type="button" className="btn btn-ghost rules-link" onClick={() => setShowRules(true)}>
          {t('lobby.rules')}
        </button>
      </div>

      <div className="lobby-footer">
        {error && <p className="form-error">{t(error)}</p>}
        <button
          type="button"
          className="btn btn-primary btn-lg btn-block"
          onClick={handleStart}
          disabled={packsLoading}
        >
          {packsLoading ? t('lobby.loading') : t('lobby.start')}
        </button>
      </div>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
