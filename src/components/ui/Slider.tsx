import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn, clamp } from '@/utils';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  accentTrack?: boolean;
}

/** Custom horizontal glass slider with a glowing accent fill. */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  className,
  accentTrack = true,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      onChange(clamp(stepped, min, max));
    },
    [min, max, step, onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateFromPointer(e.clientX);
    },
    [disabled, updateFromPointer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.buttons !== 1) return;
      updateFromPointer(e.clientX);
    },
    [disabled, updateFromPointer],
  );

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(clamp(value + step, min, max));
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(clamp(value - step, min, max));
      }}
      className={cn(
        'relative h-6 flex items-center cursor-pointer touch-none group',
        disabled && 'opacity-40 pointer-events-none',
        className,
      )}
    >
      <div className="h-1.5 w-full rounded-full bg-[rgb(var(--stroke)/0.12)] overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', accentTrack ? 'bg-accent' : 'bg-ink-dim')}
          style={{ width: `${pct}%` }}
          transition={{ duration: 0.08 }}
        />
      </div>
      <motion.div
        className="absolute h-4 w-4 rounded-full bg-accent border-2 border-white/90 shadow-accent-glow"
        style={{ left: `calc(${pct}% - 8px)` }}
        whileHover={{ scale: 1.25 }}
        whileTap={{ scale: 1.1 }}
      />
    </div>
  );
}
