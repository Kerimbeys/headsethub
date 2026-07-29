import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, RotateCcw, Cloud, Check, Music } from 'lucide-react';
import { useEqualizer, EQ_FREQUENCIES, BUILTIN_PRESETS } from '@/store/equalizer';
import { useTranslation } from '@/hooks/useTranslation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/utils';

/** EQ page — 10-band equalizer with built-in and custom presets. */
export function EqualizerPage() {
  const { t } = useTranslation();
  const enabled = useEqualizer((s) => s.enabled);
  const gains = useEqualizer((s) => s.gains);
  const activePresetId = useEqualizer((s) => s.activePresetId);
  const customPresets = useEqualizer((s) => s.customPresets);
  const cloudSync = useEqualizer((s) => s.cloudSync);
  const lastSyncedAt = useEqualizer((s) => s.lastSyncedAt);

  const setEnabled = useEqualizer((s) => s.setEnabled);
  const setGain = useEqualizer((s) => s.setGain);
  const applyPreset = useEqualizer((s) => s.applyPreset);
  const saveCustomPreset = useEqualizer((s) => s.saveCustomPreset);
  const deleteCustomPreset = useEqualizer((s) => s.deleteCustomPreset);
  const reset = useEqualizer((s) => s.reset);
  const setCloudSync = useEqualizer((s) => s.setCloudSync);

  const [newPresetName, setNewPresetName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const allPresets = useMemo(() => [...BUILTIN_PRESETS, ...customPresets], [customPresets]);

  const frequencyLabel = (hz: number): string => {
    if (hz >= 1000) return `${hz / 1000}k`;
    return `${hz}`;
  };

  return (
    <div className="p-6">
      <PageHeader title={t('eq.title')} subtitle={t('eq.subtitle')} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Equalizer bands */}
        <GlassCard gradient>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music size={16} className="text-accent" />
              <h3 className="text-sm font-semibold">10-Band Equalizer</h3>
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={enabled} onChange={setEnabled} />
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw size={12} /> {t('eq.reset')}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-10 gap-2" style={{ opacity: enabled ? 1 : 0.45 }}>
            {gains.map((gain, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="relative flex h-44 w-full items-center justify-center">
                  {/* Zero line */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-[rgb(var(--stroke)/0.15)]" />
                  {/* Bar */}
                  <motion.div
                    className="w-6 rounded-full bg-gradient-to-b from-accent/60 to-accent"
                    animate={{ height: `${(Math.abs(gain) / 12) * 48 + 8}%` }}
                    style={{
                      marginTop: gain < 0 ? 'auto' : undefined,
                      marginBottom: gain > 0 ? 'auto' : undefined,
                    }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
                <span className="mt-2 text-[10px] tabular-nums text-ink-dim">
                  {gain > 0 ? '+' : ''}{gain} dB
                </span>
                <Slider
                  value={gain}
                  min={-12}
                  max={12}
                  step={0.5}
                  onChange={(v) => setGain(i, v)}
                  className="mt-2 h-24 -rotate-90 w-36 origin-center"
                />
                <span className="mt-2 text-[11px] font-medium text-ink-dim">{frequencyLabel(EQ_FREQUENCIES[i])}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Presets + cloud */}
        <div className="space-y-4">
          <GlassCard>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-dim">{t('eq.presets')}</h4>
            <div className="mt-3 space-y-1.5">
              {allPresets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-control px-3 py-2 text-left text-sm transition-colors',
                    activePresetId === p.id
                      ? 'bg-accent/15 text-accent font-semibold'
                      : 'hover:bg-[rgb(var(--stroke)/0.06)]',
                  )}
                >
                  <span>{p.name}</span>
                  {p.builtIn ? (
                    <span className="text-[10px] text-ink-faint">BUILTIN</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomPreset(p.id);
                      }}
                      className="text-red-400/70 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </button>
              ))}
            </div>

            {showSave ? (
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder={t('eq.presetName')}
                  className="glass-subtle h-8 flex-1 rounded-control px-3 text-xs outline-none focus:ring-2 focus:ring-accent/40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPresetName.trim()) {
                      saveCustomPreset(newPresetName.trim());
                      setNewPresetName('');
                      setShowSave(false);
                    }
                    if (e.key === 'Escape') {
                      setShowSave(false);
                      setNewPresetName('');
                    }
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (newPresetName.trim()) {
                      saveCustomPreset(newPresetName.trim());
                      setNewPresetName('');
                      setShowSave(false);
                    }
                  }}
                >
                  <Save size={12} />
                </Button>
              </div>
            ) : (
              <Button
                variant="subtle"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setShowSave(true)}
              >
                <Save size={12} /> {t('eq.savePreset')}
              </Button>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Cloud size={14} className="text-accent" />
                  <h4 className="text-sm font-semibold">{t('eq.cloudSync')}</h4>
                </div>
                <p className="mt-1 text-[11px] text-ink-dim">{t('eq.cloudSyncDesc')}</p>
              </div>
              <Toggle checked={cloudSync} onChange={setCloudSync} />
            </div>
            {cloudSync && lastSyncedAt && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
                <Check size={12} /> Senkronize edildi
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
