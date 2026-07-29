import { motion } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Disc3, Zap, Wifi, Activity, Gauge, Music } from 'lucide-react';
import { useDefaultDevice, useDevices, useMediaSession, useSessions } from '@/hooks/useAudioData';
import { useTranslation } from '@/hooks/useTranslation';
import { bridge } from '@/api/bridge';
import { useUi } from '@/store/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { CircularSlider } from '@/components/ui/CircularSlider';
import { BatteryPill } from '@/components/ui/BatteryPill';
import { SignalBars } from '@/components/ui/SignalBars';
import { DeviceImage } from '@/components/ui/DeviceImage';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn, deviceLabel, formatDuration, formatSampleRate, batteryColor } from '@/utils';

/** Dashboard: the central hub showing the current device, volume, now-playing and quick mixer. */
export function DashboardPage() {
  const device = useDefaultDevice();
  const devices = useDevices();
  const sessions = useSessions();
  const media = useMediaSession();
  const { t } = useTranslation();
  const setPage = useUi((s) => s.setPage);

  const connected = devices.filter((d) => d.status === 'connected');

  return (
    <div className="p-6">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      <div className="grid grid-cols-12 gap-5">
        {/* ---------------------- Main device ---------------------- */}
        <GlassCard className="col-span-12 xl:col-span-5" gradient>
          <div className="flex items-center gap-5">
            <motion.div
              animate={{ y: device?.muted ? [0, -6, 0] : 0 }}
              transition={{ duration: 0.6, repeat: device?.muted ? Infinity : 0 }}
            >
              <DeviceImage imageKey={device?.imageKey ?? 'headset'} size={128} glow />
            </motion.div>
            <div className="min-w-0 flex-1">
              <Badge tone={device?.status === 'connected' ? 'success' : 'danger'}>
                {t(`status.${device?.status ?? 'disconnected'}`)}
              </Badge>
              <h2 className="mt-2 text-xl font-bold">{device ? deviceLabel(device) : '—'}</h2>
              <p className="mt-0.5 text-xs text-ink-dim">
                {device?.name}{device?.customName ? ` (${device.name})` : ''}
              </p>
              {device?.battery.combined !== null && device?.battery.combined !== undefined && (
                <div className="mt-3">
                  <BatteryPill level={device.battery.combined} charging={device.battery.charging} label={t('common.battery')} />
                  {device.battery.left !== null && (
                    <div className="mt-1 flex gap-3 text-[11px] text-ink-dim">
                      <span className={batteryColor(device.battery.left)}>{t('common.left')} %{device.battery.left}</span>
                      <span className={batteryColor(device.battery.right)}>{t('common.right')} %{device.battery.right}</span>
                      <span className={batteryColor(device.battery.case)}>{t('common.case')} %{device.battery.case}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                {device?.signalStrength !== null && device?.signalStrength !== undefined && (
                  <span className="flex items-center gap-1 text-ink-dim"><Wifi size={12} /> {t('common.signal')} {device.signalStrength}%</span>
                )}
                {device?.rssi !== null && device?.rssi !== undefined && (
                  <SignalBars rssi={device.rssi} />
                )}
                {device?.bluetoothVersion && (
                  <span className="flex items-center gap-1 text-ink-dim"><Zap size={12} /> BT {device.bluetoothVersion}</span>
                )}
                {device?.codec && (
                  <span className="flex items-center gap-1 text-ink-dim"><Disc3 size={12} /> {device.codec}</span>
                )}
                {device?.latencyMs !== null && device?.latencyMs !== undefined && (
                  <span className="flex items-center gap-1 text-ink-dim"><Gauge size={12} /> {device.latencyMs} ms</span>
                )}
              </div>
            </div>
          </div>

          {/* Technical details */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <InfoCell label={t('common.sampleRate')} value={device ? formatSampleRate(device.sampleRate) : '—'} />
            <InfoCell label={t('common.bitDepth')} value={device ? `${device.bitDepth}-bit` : '—'} />
            <InfoCell label={t('common.latency')} value={device?.latencyMs !== null && device?.latencyMs !== undefined ? `${device.latencyMs} ms` : '—'} />
          </div>
        </GlassCard>

        {/* ---------------------- Volume + Now Playing ---------------------- */}
        <div className="col-span-12 xl:col-span-4 grid grid-cols-1 gap-5">
          <GlassCard className="flex flex-col items-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-dim">{t('dashboard.masterVolume')}</p>
            <CircularSlider
              value={device?.volume ?? 0}
              onChange={(v) => device && void bridge.devices.setVolume(device.id, v)}
              className="mt-4"
            >
              <div className="text-center">
                <motion.div className="flex items-center justify-center" animate={{ scale: device?.muted ? 0.95 : 1 }}>
                  {device?.muted ? <VolumeX size={28} className="text-ink-faint" /> : <Volume2 size={28} className="text-accent" />}
                </motion.div>
                <p className="mt-1 text-3xl font-extrabold tabular-nums">{device?.muted ? '—' : device?.volume}%</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => device && void bridge.devices.setMute(device.id, !device.muted)}
                >
                  {device?.muted ? t('common.unmute') : t('common.mute')}
                </Button>
              </div>
            </CircularSlider>
          </GlassCard>

          <GlassCard>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-dim">{t('dashboard.nowPlaying')}</p>
            {media ? (
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-card bg-[rgb(var(--surface)/0.4)]">
                  {media.albumArtUrl ? (
                    <img src={media.albumArtUrl} alt={media.album} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-accent"><Music size={28} /></div>
                  )}
                  {media.isPlaying && (
                    <span className="absolute inset-x-2 bottom-2 flex items-end justify-center gap-0.5">
                      {[3, 6, 4, 7, 3].map((h, i) => (
                        <motion.span
                          key={i}
                          className="w-0.5 rounded-full bg-accent"
                          animate={{ height: [h, h + 4, h] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{media.title}</p>
                  <p className="truncate text-xs text-ink-dim">{media.artist}</p>
                  <p className="mt-1 text-[11px] text-ink-faint">{media.album}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-dim">
                    <span className="tabular-nums">{formatDuration(media.positionMs)}</span>
                    <div className="h-0.5 flex-1 rounded-full bg-[rgb(var(--stroke)/0.12)]">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(media.positionMs / media.durationMs) * 100}%` }} />
                    </div>
                    <span className="tabular-nums">{formatDuration(media.durationMs)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-dim">{t('music.notPlaying')}</p>
            )}
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => void bridge.media.control('previous')}><SkipBack size={16} /></Button>
              <Button size="icon" variant="primary" onClick={() => void bridge.media.control(media?.isPlaying ? 'pause' : 'play')}>
                {media?.isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => void bridge.media.control('next')}><SkipForward size={16} /></Button>
            </div>
          </GlassCard>
        </div>

        {/* ---------------------- Quick Mixer ---------------------- */}
        <GlassCard className="col-span-12 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-dim">{t('dashboard.quickMixer')}</p>
            <button onClick={() => setPage('mixer')} className="text-xs font-medium text-accent hover:underline">
              {t('dashboard.seeAll')}
            </button>
          </div>
          <div className="space-y-3">
            {sessions.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center gap-2.5">
                <AppIcon iconKey={s.iconKey} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="truncate font-medium">{s.displayName}</span>
                    <button
                      onClick={() => void bridge.sessions.setMute(s.id, !s.muted)}
                      className={cn('transition-colors', s.muted ? 'text-red-400' : 'text-ink-faint hover:text-ink')}
                      aria-label={s.muted ? 'unmute' : 'mute'}
                    >
                      {s.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                  </div>
                  <Slider
                    value={s.muted ? 0 : s.volume}
                    onChange={(v) => void bridge.sessions.setVolume(s.id, v)}
                    className="mt-0.5"
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* ---------------------- Connected devices ---------------------- */}
        <GlassCard className="col-span-12">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-dim">{t('dashboard.connectedDevices')}</p>
            <button onClick={() => setPage('devices')} className="text-xs font-medium text-accent hover:underline">
              {t('dashboard.seeAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {connected.map((d) => (
              <motion.button
                key={d.id}
                onClick={() => {
                  void bridge.devices.setDefault(d.id);
                  void bridge.mic.update({ deviceId: d.id });
                }}
                whileHover={{ y: -3 }}
                className={cn(
                  'group flex flex-col items-center rounded-card border border-transparent p-3 text-center transition-colors',
                  d.isDefault
                    ? 'border-accent/30 bg-accent/10'
                    : 'border-[rgb(var(--stroke)/0.08)] hover:border-accent/20 hover:bg-accent/5',
                )}
              >
                <DeviceImage imageKey={d.imageKey} size={56} className="mb-2" />
                <span className="w-full truncate text-xs font-semibold">{deviceLabel(d)}</span>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <Badge tone="success" className="text-[10px]">
                    {t('status.connected')}
                  </Badge>
                  {d.battery.combined !== null && d.battery.combined !== undefined && (
                    <span className={cn('tabular-nums', batteryColor(d.battery.combined))}>
                      %{d.battery.combined}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
            {connected.length === 0 && (
              <p className="col-span-full text-center text-sm text-ink-dim">—</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-subtle rounded-control px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold">
        {value.endsWith(' ms') && <Activity size={13} className="text-accent" />}
        {value}
      </p>
    </div>
  );
}
