import { useState, type ReactNode } from 'react';
import { Logo } from './Logo';
import { useI18n } from '../i18n/useI18n';
import { LANGUAGES, type Language } from '../i18n/strings';
import { isMuted, primeAudio, setMuted } from '../utils/soundEffects';

type TopBarProps = {
  /** Rendered on the right of the bar, before the toggles. */
  extra?: ReactNode;
  compact?: boolean;
};

export function TopBar({ extra, compact = false }: TopBarProps) {
  const { t, lang, setLang } = useI18n();
  const [muted, setMutedState] = useState(isMuted);

  const toggleSound = () => {
    primeAudio();
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <Logo size={compact ? 32 : 40} />
        {!compact && (
          <div>
            <h1>{t('app.name')}</h1>
            <p>{t('app.tagline')}</p>
          </div>
        )}
      </div>

      <div className="topbar-actions">
        {extra}
        <button
          type="button"
          className="icon-btn"
          onClick={toggleSound}
          title={muted ? t('sound.off') : t('sound.on')}
          aria-label={muted ? t('sound.off') : t('sound.on')}
        >
          {muted ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4z" />
              <path d="m23 9-6 6M17 9l6 6" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          )}
        </button>

        <div className="segmented compact lang-switch" role="group" aria-label={t('lang.switch')}>
          {LANGUAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={lang === item.id ? 'active' : ''}
              onClick={() => setLang(item.id as Language)}
              aria-pressed={lang === item.id}
            >
              {item.short}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
