import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Headphones,
  Bluetooth,
  SlidersHorizontal,
  Mic,
  AudioWaveform,
  BatteryCharging,
  Sparkles,
  Wrench,
  Settings,
} from 'lucide-react';
import { useUi, type PageId } from '@/store/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { useDefaultDevice } from '@/hooks/useAudioData';
import { cn, deviceLabel } from '@/utils';
import { BatteryPill } from '@/components/ui/BatteryPill';
import { DeviceImage } from '@/components/ui/DeviceImage';

const NAV: { id: PageId; icon: typeof LayoutDashboard; labelKey: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { id: 'devices', icon: Headphones, labelKey: 'nav.devices' },
  { id: 'bluetooth', icon: Bluetooth, labelKey: 'nav.bluetooth' },
  { id: 'mixer', icon: SlidersHorizontal, labelKey: 'nav.mixer' },
  { id: 'microphone', icon: Mic, labelKey: 'nav.microphone' },
  { id: 'equalizer', icon: AudioWaveform, labelKey: 'nav.equalizer' },
  { id: 'battery', icon: BatteryCharging, labelKey: 'nav.battery' },
  { id: 'profiles', icon: Sparkles, labelKey: 'nav.profiles' },
  { id: 'tools', icon: Wrench, labelKey: 'nav.tools' },
  { id: 'settings', icon: Settings, labelKey: 'nav.settings' },
];

/** Left navigation rail with active pill animation and current device mini card. */
export function Sidebar() {
  const page = useUi((s) => s.page);
  const setPage = useUi((s) => s.setPage);
  const { t } = useTranslation();
  const device = useDefaultDevice();

  return (
    <nav className="relative z-10 flex w-60 shrink-0 flex-col gap-1 px-3 pb-4">
      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, icon: Icon, labelKey }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-control px-3.5 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-ink' : 'text-ink-dim hover:text-ink hover:bg-[rgb(var(--stroke)/0.05)]',
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-control bg-accent/12 border border-accent/20"
                  transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                />
              )}
              <Icon size={17} className={cn('relative', active && 'text-accent')} strokeWidth={2.2} />
              <span className="relative">{t(labelKey)}</span>
              {active && (
                <motion.span
                  layoutId="nav-dot"
                  className="absolute right-3 h-1.5 w-1.5 rounded-full bg-accent shadow-accent-glow"
                />
              )}
            </button>
          );
        })}
      </div>

      {device && (
        <motion.button
          onClick={() => setPage('dashboard')}
          className="glass-subtle mt-2 flex items-center gap-3 p-3 text-left"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <DeviceImage imageKey={device.imageKey} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{deviceLabel(device)}</p>
            <BatteryPill level={device.battery.combined} charging={device.battery.charging} className="text-[11px]" />
          </div>
        </motion.button>
      )}
    </nav>
  );
}
