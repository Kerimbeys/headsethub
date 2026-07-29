import { motion } from 'framer-motion';
import { cn, rssiTier } from '@/utils';

interface SignalBarsProps {
  rssi: number | null;
  className?: string;
}

/** 4-bar Bluetooth signal indicator driven by RSSI. */
export function SignalBars({ rssi, className }: SignalBarsProps) {
  const tier = rssiTier(rssi);
  return (
    <span className={cn('inline-flex items-end gap-0.5 h-4', className)} title={rssi !== null ? `${rssi} dBm` : ''}>
      {[1, 2, 3, 4].map((bar) => (
        <motion.span
          key={bar}
          initial={false}
          animate={{ opacity: bar <= tier ? 1 : 0.2 }}
          className={cn('w-1 rounded-sm', bar <= tier ? 'bg-accent' : 'bg-ink-faint')}
          style={{ height: `${bar * 25}%` }}
        />
      ))}
    </span>
  );
}
