import { BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Zap } from 'lucide-react';
import { cn, batteryColor } from '@/utils';

interface BatteryPillProps {
  level: number | null;
  charging?: boolean;
  label?: string;
  className?: string;
}

function iconFor(level: number | null) {
  if (level === null) return BatteryWarning;
  if (level > 65) return BatteryFull;
  if (level > 30) return BatteryMedium;
  return BatteryLow;
}

/** Battery indicator with color-coded level and charging bolt. */
export function BatteryPill({ level, charging = false, label, className }: BatteryPillProps) {
  const Icon = iconFor(level);
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', batteryColor(level), className)}>
      <Icon size={16} strokeWidth={2.2} />
      {label && <span className="text-ink-faint text-xs">{label}</span>}
      <span>{level === null ? '—' : `%${level}`}</span>
      {charging && <Zap size={12} className="text-amber-400 fill-amber-400" />}
    </span>
  );
}
