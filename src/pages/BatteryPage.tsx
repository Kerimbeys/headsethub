import { useState } from 'react';
import { motion } from 'framer-motion';
import { BatteryCharging, Clock, Calendar, CalendarDays } from 'lucide-react';
import { useDevices, useBatteryHistory } from '@/hooks/useAudioData';
import { useTranslation } from '@/hooks/useTranslation';
import { useDefaultDevice } from '@/hooks/useAudioData';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { BatteryPill } from '@/components/ui/BatteryPill';
import { DeviceImage } from '@/components/ui/DeviceImage';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn, deviceLabel, estimateRemainingHours } from '@/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Range = 'daily' | 'weekly';

/** Battery History — line chart of recent usage + estimates. */
export function BatteryPage() {
  const { t } = useTranslation();
  const devices = useDevices();
  const defaultDevice = useDefaultDevice();
  const [selectedId, setSelectedId] = useState<string>(defaultDevice?.id ?? devices[0]?.id ?? '');
  const [range, setRange] = useState<Range>('daily');

  const sinceMs = range === 'daily' ? 24 * 3600_000 : 7 * 24 * 3600_000;
  const samples = useBatteryHistory(selectedId, sinceMs);
  const device = devices.find((d) => d.id === selectedId);

  const remaining = estimateRemainingHours(samples);

  const chartData = samples.map((s) => ({
    t: range === 'daily'
      ? new Date(s.timestamp).getHours().toString().padStart(2, '0')
      : new Date(s.timestamp).toLocaleDateString('tr-TR', { weekday: 'short', hour: '2-digit' }),
    level: s.level,
  }));

  const battDevices = devices.filter((d) => d.battery.combined !== null);

  return (
    <div className="p-6">
      <PageHeader title={t('battery.title')} subtitle={t('battery.subtitle')} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
        <GlassCard gradient>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {device && <DeviceImage imageKey={device.imageKey} size={48} />}
              <div>
                <h3 className="text-lg font-bold">{device ? deviceLabel(device) : '—'}</h3>
                <BatteryPill level={device?.battery.combined ?? null} charging={device?.battery.charging} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={range === 'daily' ? 'primary' : 'subtle'}
                size="sm"
                onClick={() => setRange('daily')}
              >
                <Calendar size={12} /> {t('battery.daily')}
              </Button>
              <Button
                variant={range === 'weekly' ? 'primary' : 'subtle'}
                size="sm"
                onClick={() => setRange('weekly')}
              >
                <CalendarDays size={12} /> {t('battery.weekly')}
              </Button>
            </div>
          </div>

          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="t"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,15,22,0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, t('common.battery')]}
                />
                <Line
                  type="monotone"
                  dataKey="level"
                  stroke={`rgb(var(--accent))`}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: `rgb(var(--accent))` }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {remaining !== null && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Clock size={14} className="text-accent" />
              <span className="text-ink-dim">{t('battery.estimated')}:</span>
              <span className="font-semibold tabular-nums">{remaining} {t('battery.hours')}</span>
            </div>
          )}
        </GlassCard>

        {/* Device list */}
        <GlassCard>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-dim">{t('battery.usage')}</h4>
          <div className="mt-3 space-y-2">
            {battDevices.map((d) => (
              <motion.button
                key={d.id}
                whileHover={{ x: 3 }}
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-control p-2.5 text-left transition-colors',
                  d.id === selectedId
                    ? 'bg-accent/15 border border-accent/25'
                    : 'hover:bg-[rgb(var(--stroke)/0.06)] border border-transparent',
                )}
              >
                <DeviceImage imageKey={d.imageKey} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{deviceLabel(d)}</p>
                  <BatteryPill level={d.battery.combined} charging={d.battery.charging} className="text-[11px]" />
                </div>
                {d.battery.charging && <BatteryCharging size={14} className="text-amber-400" />}
              </motion.button>
            ))}
            {battDevices.length === 0 && (
              <p className="text-sm text-ink-dim">Pil bilgisi olan cihaz yok.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
