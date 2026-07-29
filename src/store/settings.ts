import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/i18n/translations';

export type ThemeMode = 'light' | 'dark' | 'oled';
export type AccentKey = 'blue' | 'purple' | 'orange' | 'green' | 'red';

export const ACCENTS: Record<AccentKey, { rgb: string; hex: string }> = {
  blue: { rgb: '59 130 246', hex: '#3b82f6' },
  purple: { rgb: '168 85 247', hex: '#a855f7' },
  orange: { rgb: '249 115 22', hex: '#f97316' },
  green: { rgb: '34 197 94', hex: '#22c55e' },
  red: { rgb: '239 68 68', hex: '#ef4444' },
};

interface SettingsState {
  theme: ThemeMode;
  accent: AccentKey;
  glassOpacity: number; // 0.2 - 0.9
  blurIntensity: number; // 4 - 40 px
  cornerRadius: number; // 8 - 28 px
  language: Language;
  startWithWindows: boolean;
  discordRpc: boolean;
  obsIntegration: boolean;
  autoReconnect: boolean;
  setTheme: (t: ThemeMode) => void;
  setAccent: (a: AccentKey) => void;
  setGlassOpacity: (v: number) => void;
  setBlurIntensity: (v: number) => void;
  setCornerRadius: (v: number) => void;
  setLanguage: (l: Language) => void;
  setStartWithWindows: (v: boolean) => void;
  setDiscordRpc: (v: boolean) => void;
  setObsIntegration: (v: boolean) => void;
  setAutoReconnect: (v: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accent: 'blue',
      glassOpacity: 0.55,
      blurIntensity: 24,
      cornerRadius: 20,
      language: 'tr',
      startWithWindows: false,
      discordRpc: true,
      obsIntegration: false,
      autoReconnect: true,
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setGlassOpacity: (glassOpacity) => set({ glassOpacity }),
      setBlurIntensity: (blurIntensity) => set({ blurIntensity }),
      setCornerRadius: (cornerRadius) => set({ cornerRadius }),
      setLanguage: (language) => set({ language }),
      setStartWithWindows: (startWithWindows) => set({ startWithWindows }),
      setDiscordRpc: (discordRpc) => set({ discordRpc }),
      setObsIntegration: (obsIntegration) => set({ obsIntegration }),
      setAutoReconnect: (autoReconnect) => set({ autoReconnect }),
    }),
    { name: 'headsethub-settings' },
  ),
);

/** Applies the current theme tokens onto :root / body. */
export function applyThemeToDom(state: Pick<SettingsState, 'theme' | 'accent' | 'glassOpacity' | 'blurIntensity' | 'cornerRadius'>): void {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark', 'theme-oled');
  root.classList.add(`theme-${state.theme}`);
  root.classList.toggle('dark', state.theme !== 'light');
  root.style.setProperty('--accent', ACCENTS[state.accent].rgb);
  root.style.setProperty('--glass-opacity', String(state.glassOpacity));
  root.style.setProperty('--glass-blur', `${state.blurIntensity}px`);
  root.style.setProperty('--radius-card', `${state.cornerRadius}px`);
  root.style.setProperty('--radius-control', `${Math.max(8, state.cornerRadius - 8)}px`);
}
