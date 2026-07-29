import { useCallback } from 'react';
import { useSettings } from '@/store/settings';
import { TRANSLATIONS } from '@/i18n/translations';

/** Translation hook: t('key') with English fallback. */
export function useTranslation(): { t: (key: string) => string } {
  const language = useSettings((s) => s.language);
  const t = useCallback(
    (key: string): string => TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key] ?? key,
    [language],
  );
  return { t };
}
