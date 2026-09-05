import { useContext } from 'react';
import { LanguageContext, type I18nValue } from './LanguageContext';

export function useI18n(): I18nValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error('useI18n must be used inside a <LanguageProvider>');
  }
  return value;
}
