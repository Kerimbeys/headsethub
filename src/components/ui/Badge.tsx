import { cn } from '@/utils';
import type { ReactNode } from 'react';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent border-accent/25',
  success: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/12 text-red-400 border-red-500/20',
  neutral: 'bg-[rgb(var(--stroke)/0.06)] text-ink-dim border-[rgb(var(--stroke)/0.1)]',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

/** Small status pill. */
export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
