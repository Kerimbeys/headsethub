import { useEffect } from 'react';
import { useSettings, applyThemeToDom } from '@/store/settings';

/** Keeps the DOM theme tokens in sync with the settings store. */
export function useTheme(): void {
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  const glassOpacity = useSettings((s) => s.glassOpacity);
  const blurIntensity = useSettings((s) => s.blurIntensity);
  const cornerRadius = useSettings((s) => s.cornerRadius);

  useEffect(() => {
    applyThemeToDom({ theme, accent, glassOpacity, blurIntensity, cornerRadius });
  }, [theme, accent, glassOpacity, blurIntensity, cornerRadius]);
}
