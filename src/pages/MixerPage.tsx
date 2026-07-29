import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Headphones, MonitorSpeaker } from 'lucide-react';
import { useDevices, useSessions } from '@/hooks/useAudioData';
import { useTranslation } from '@/hooks/useTranslation';
import { bridge } from '@/api/bridge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { AppIcon } from '@/components/ui/AppIcon';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn, deviceLabel } from '@/utils';

/** Audio Mixer — EarTrumpet-style per-app volume, routing and mute. */
export function MixerPage() {
  const devices = useDevices();
  const sessions = useSessions();
  const { t } = useTranslation();

  const outputOptions: SelectOption[] = devices
    .filter((d) => d.kind !== 'microphone' && d.status === 'connected')
    .map((d) => ({ value: d.id, label: deviceLabel(d) }));

  const outputDevices = devices.filter((d) => d.kind !== 'microphone' && d.status === 'connected');

  return (
    <div className="p-6">
      <PageHeader title={t('mixer.title')} subtitle={t('mixer.subtitle')} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {outputDevices.map((d) => (
          <GlassCard key={d.id} hoverable>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-control bg-accent/15 text-accent">
                {d.kind === 'microphone' ? <Headphones size={18} /> : <MonitorSpeaker size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{deviceLabel(d)}</p>
                <p className="text-[11px] text-ink-dim">
                  {d.codec ?? 'PCM'} · {(d.sampleRate / 1000).toFixed(0)} kHz · {d.bitDepth}-bit
                </p>
              </div>
              {d.isDefault && (
                <Badge tone="success" className="text-[10px]">{t('common.default')}</Badge>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span className="text-ink-dim w-16">{t('common.volume')}</span>
              <Slider
                value={d.muted ? 0 : d.volume}
                onChange={(v) => void bridge.devices.setVolume(d.id, v)}
                className="flex-1"
              />
              <span className="w-10 text-right tabular-nums">{d.muted ? '—' : `${d.volume}%`}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => void bridge.devices.setMute(d.id, !d.muted)}
              >
                {d.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {sessions.map((s, i) => {
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-subtle p-3.5"
              >
                <div className="flex items-center gap-3">
                  <AppIcon iconKey={s.iconKey} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.displayName}</p>
                    <p className="truncate text-[11px] text-ink-faint">{s.appName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-8 w-8', s.muted && 'text-red-400')}
                    onClick={() => void bridge.sessions.setMute(s.id, !s.muted)}
                  >
                    {s.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[11px] text-ink-dim w-14">{t('common.volume')}</span>
                  <Slider
                    value={s.muted ? 0 : s.volume}
                    onChange={(v) => void bridge.sessions.setVolume(s.id, v)}
                    className="flex-1"
                  />
                  <span className="w-10 text-right text-[11px] tabular-nums">{s.muted ? '—' : `${s.volume}%`}</span>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <Headphones size={13} className="text-ink-dim" />
                  <Select
                    value={s.outputDeviceId}
                    options={outputOptions}
                    onChange={(v) => void bridge.sessions.setOutput(s.id, v)}
                    compact
                    className="flex-1"
                  />
                </div>

                <VolumeMeter peak={s.peak} muted={s.muted} />
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function VolumeMeter({ peak, muted }: { peak: number; muted: boolean }) {
  const barRef = useRef<HTMLDivElement>(null);
  const value = muted ? 0 : peak;

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${value}%`;
    }
  }, [value]);

  return (
    <div className="mt-2 h-1.5 rounded-full bg-[rgb(var(--stroke)/0.1)] overflow-hidden">
      <div
        ref={barRef}
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 transition-all duration-75"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
