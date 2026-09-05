import { useEffect } from 'react';
import { useI18n } from '../i18n/useI18n';
import type { TranslationKey } from '../i18n/strings';
import './RulesModal.css';

type Section = {
  icon: string;
  title: TranslationKey;
  items: TranslationKey[];
  tone?: 'default' | 'forbidden' | 'penalty';
};

const SECTIONS: Section[] = [
  {
    icon: '🪑',
    title: 'rules.setup.title',
    items: ['rules.setup.1', 'rules.setup.2', 'rules.setup.3'],
  },
  {
    icon: '⏱️',
    title: 'rules.play.title',
    items: ['rules.play.1', 'rules.play.2', 'rules.play.3', 'rules.play.4'],
  },
  {
    icon: '🚫',
    title: 'rules.forbidden.title',
    items: ['rules.forbidden.1', 'rules.forbidden.2', 'rules.forbidden.3', 'rules.forbidden.4'],
    tone: 'forbidden',
  },
  {
    icon: '⚖️',
    title: 'rules.penalty.title',
    items: ['rules.penalty.1', 'rules.penalty.2'],
    tone: 'penalty',
  },
];

const SPECS: { label: TranslationKey; value: TranslationKey }[] = [
  { label: 'rules.specs.players', value: 'rules.specs.players.value' },
  { label: 'rules.specs.genre', value: 'rules.specs.genre.value' },
  { label: 'rules.specs.age', value: 'rules.specs.age.value' },
  { label: 'rules.specs.length', value: 'rules.specs.length.value' },
];

export function RulesModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal rules-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h2>{t('rules.title')}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('rules.close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {SECTIONS.map((section) => (
            <section className={`rules-section ${section.tone ?? 'default'}`} key={section.title}>
              <h3>
                <span aria-hidden="true">{section.icon}</span>
                {t(section.title)}
              </h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{t(item)}</li>
                ))}
              </ul>
            </section>
          ))}

          <section className="rules-section default">
            <h3>
              <span aria-hidden="true">📋</span>
              {t('rules.specs.title')}
            </h3>
            <dl className="rules-specs">
              {SPECS.map((spec) => (
                <div key={spec.label}>
                  <dt>{t(spec.label)}</dt>
                  <dd>{t(spec.value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
            {t('rules.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}
