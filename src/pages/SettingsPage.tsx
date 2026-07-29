
import { Sun, Moon, Zap, Palette, GlassWater, Maximize2, Globe, MonitorSmartphone, MessageCircle, Radio } from 'lucide-react';
import { useSettings, ACCENTS, type AccentKey, type ThemeMode } from '@/store/settings';
import { useTranslation } from '@/hooks/useTranslation';
import { useSystemInfo } from '@/hooks/useAudioData';
import { bridge, isElectron } from '@/api/bridge';
import { useUi } from '@/store/ui';
import type { Language } from '@/i18n/translations';
import { LANGUAGE_NAMES } from '@/i18n/translations';
import { GlassCard } from '@/components/ui/GlassCard';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/utils';

/** Settings page — language, theme, accent, glass parameters, integrations, widgets. */
export function SettingsPage() {
  const { t } = useTranslation();
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  const glassOpacity = useSettings((s) => s.glassOpacity);
  const blurIntensity = useSettings((s) => s.blurIntensity);
  const cornerRadius = useSettings((s) => s.cornerRadius);
  const language = useSettings((s) => s.language);
  const startWithWindows = useSettings((s) => s.startWithWindows);
  const discordRpc = useSettings((s) => s.discordRpc);
  const obsIntegration = useSettings((s) => s.obsIntegration);
  const systemInfo = useSystemInfo();
  const pushToast = useUi((s) => s.pushToast);

  const setTheme = useSettings((s) => s.setTheme);
  const setAccent = useSettings((s) => s.setAccent);
  const setGlassOpacity = useSettings((s) => s.setGlassOpacity);
  const setBlurIntensity = useSettings((s) => s.setBlurIntensity);
  const setCornerRadius = useSettings((s) => s.setCornerRadius);
  const setLanguage = useSettings((s) => s.setLanguage);
  const setStartWithWindows = useSettings((s) => s.setStartWithWindows);
  const setDiscordRpc = useSettings((s) => s.setDiscordRpc);
  const setObsIntegration = useSettings((s) => s.setObsIntegration);

  const handleStartupToggle = async (v: boolean) => {
    setStartWithWindows(v);
    if (isElectron) await bridge.system.setAutoLaunch(v);
    pushToast({ kind: 'info', title: t('settings.startup'), body: v ? 'Açık' : 'Kapalı' });
  };

  const toggleWidget = (size: 'small' | 'medium' | 'large') => async () => {
    if (!isElectron) {
      pushToast({ kind: 'info', title: 'Widget\'lar', body: 'Yalnızca Electron uygulamasında çalışır.' });
      return;
    }
    await bridge.widgets.toggle(size);
  };

  const themeOptions = [
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
    { value: 'oled', label: t('settings.themeOled') },
  ];

  const languageOptions = (Object.keys(LANGUAGE_NAMES) as Language[]).map((k) => ({
    value: k,
    label: LANGUAGE_NAMES[k],
  }));

  return (
    <div className="p-6">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* General */}
        <GlassCard>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Globe size={15} className="text-accent" /> {t('settings.general')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('settings.startup')}</p>
                <p className="text-[11px] text-ink-dim">{t('settings.startupDesc')}</p>
              </div>
              <Toggle checked={startWithWindows} onChange={handleStartupToggle} />
            </div>
            <div>
              <label className="text-xs text-ink-dim">{t('settings.language')}</label>
              <Select value={language} options={languageOptions} onChange={(v) => setLanguage(v as Language)} className="mt-1" />
            </div>
          </div>
        </GlassCard>

        {/* Appearance */}
        <GlassCard>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Palette size={15} className="text-accent" /> {t('settings.appearance')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-ink-dim flex items-center gap-1">
                {theme === 'light' ? <Sun size={11} /> : <Moon size={11} />} {t('settings.theme')}
              </label>
              <div className="mt-1.5 flex gap-2">
                {themeOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setTheme(o.value as ThemeMode)}
                    className={cn(
                      'flex-1 rounded-control px-3 py-2 text-xs font-medium transition-colors',
                      theme === o.value
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'glass-subtle text-ink-dim hover:text-ink',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-ink-dim">{t('settings.accentColor')}</label>
              <div className="mt-1.5 flex gap-2">
                {(Object.keys(ACCENTS) as AccentKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setAccent(k)}
                    className={cn(
                      'h-8 w-8 rounded-full transition-transform',
                      accent === k ? 'scale-110 ring-2 ring-white/80' : 'hover:scale-105',
                    )}
                    style={{ background: ACCENTS[k].hex }}
                    title={t(`accent.${k}`)}
                  />
                ))}
              </div>
            </div>

            <SliderField
              label={t('settings.glassOpacity')}
              icon={<GlassWater size={12} />}
              value={glassOpacity}
              min={0.2}
              max={0.9}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={setGlassOpacity}
            />
            <SliderField
              label={t('settings.blurIntensity')}
              icon={<GlassWater size={12} />}
              value={blurIntensity}
              min={4}
              max={40}
              step={2}
              format={(v) => `${v}px`}
              onChange={setBlurIntensity}
            />
            <SliderField
              label={t('settings.cornerRadius')}
              icon={<Maximize2 size={12} />}
              value={cornerRadius}
              min={8}
              max={28}
              step={2}
              format={(v) => `${v}px`}
              onChange={setCornerRadius}
            />
          </div>
        </GlassCard>

        {/* Integrations */}
        <GlassCard>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <MonitorSmartphone size={15} className="text-accent" /> {t('settings.integrations')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <MessageCircle size={13} /> {t('settings.discordRpc')}
                </p>
                <p className="text-[11px] text-ink-dim">{t('settings.discordRpcDesc')}</p>
              </div>
              <Toggle checked={discordRpc} onChange={setDiscordRpc} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Radio size={13} /> {t('settings.obs')}
                </p>
                <p className="text-[11px] text-ink-dim">{t('settings.obsDesc')}</p>
              </div>
              <Toggle checked={obsIntegration} onChange={setObsIntegration} />
            </div>
          </div>
        </GlassCard>

        {/* Widgets */}
        <GlassCard>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Zap size={15} className="text-accent" /> {t('settings.widgets')}
          </h3>
          <div className="space-y-3">
            {[
              { size: 'small' as const, label: t('settings.widgetSmall') },
              { size: 'medium' as const, label: t('settings.widgetMedium') },
              { size: 'large' as const, label: t('settings.widgetLarge') },
            ].map((w) => (
              <div key={w.size} className="flex items-center justify-between">
                <span className="text-sm">{w.label}</span>
                <Button variant="subtle" size="sm" onClick={toggleWidget(w.size)}>
                  {t('settings.widgetToggle')}
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* System info */}
        <GlassCard className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Sistem</h3>
          <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <InfoField label="Platform" value={systemInfo?.platform ?? '—'} />
            <InfoField label="Windows" value={systemInfo?.isWindows ? 'Evet' : 'Hayır'} />
            <InfoField label="Mod" value={systemInfo?.simulated ? 'Simülasyon' : 'Native'} />
            <InfoField label="Sürüm" value={systemInfo?.appVersion ?? '1.0.0'} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function SliderField({ label, icon, value, min, max, step, format, onChange }: {
  label: string; icon: React.ReactNode; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-ink-dim">{icon} {label}</span>
        <span className="font-semibold tabular-nums">{format(value)}</span>
      </div>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-subtle rounded-control px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
