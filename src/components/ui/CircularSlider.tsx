import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn, clamp } from '@/utils';

interface CircularSliderProps {
  value: number; // 0-100
  onChange: (value: number) => void;
  size?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const START_ANGLE = 135; // degrees, gap at the bottom
const SWEEP = 270;

/** Beautiful circular volume slider with a glowing arc. */
export function CircularSlider({
  value,
  onChange,
  size = 220,
  disabled = false,
  className,
  children,
}: CircularSliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const stroke = 14;
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcLen = (SWEEP / 360) * circumference;
  const filled = (value / 100) * arcLen;

  const angleFromPointer = useCallback(
    (clientX: number, clientY: number): number | null => {
      const el = ref.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = clientX - (rect.left + rect.width / 2);
      const y = clientY - (rect.top + rect.height / 2);
      let deg = (Math.atan2(y, x) * 180) / Math.PI; // -180..180, 0 = right
      deg = (deg + 360) % 360;
      // Map so that START_ANGLE (135°) = 0 progress, sweeping clockwise 270°.
      let rel = deg - START_ANGLE;
      if (rel < 0) rel += 360;
      if (rel > SWEEP) {
        // In the dead zone at the bottom: snap to nearest end.
        return rel - SWEEP < (360 - SWEEP) / 2 ? 100 : 0;
      }
      return (rel / SWEEP) * 100;
    },
    [],
  );

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      if (e.type === 'pointermove' && e.buttons !== 1) return;
      const pct = angleFromPointer(e.clientX, e.clientY);
      if (pct !== null) onChange(clamp(Math.round(pct), 0, 100));
    },
    [disabled, angleFromPointer, onChange],
  );

  // Knob position
  const knobAngle = ((START_ANGLE + (value / 100) * SWEEP) * Math.PI) / 180;
  const knobX = cx + r * Math.cos(knobAngle);
  const knobY = cy + r * Math.sin(knobAngle);

  return (
    <div
      ref={ref}
      className={cn('relative select-none touch-none', disabled && 'opacity-40 pointer-events-none', className)}
      style={{ width: size, height: size }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={handlePointer}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="rotate-0">
        <defs>
          <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`rgb(var(--accent) / 0.6)`} />
            <stop offset="100%" stopColor={`rgb(var(--accent))`} />
          </linearGradient>
          <filter id="arc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(var(--stroke) / 0.1)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
          transform={`rotate(${START_ANGLE} ${cx} ${cy})`}
        />
        {/* Fill */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#arc-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          filter="url(#arc-glow)"
          strokeDasharray={`${filled} ${circumference}`}
          transform={`rotate(${START_ANGLE} ${cx} ${cy})`}
          initial={false}
          animate={{ strokeDasharray: `${filled} ${circumference}` }}
          transition={{ duration: 0.15 }}
        />
        {/* Knob */}
        <motion.circle
          cx={knobX}
          cy={knobY}
          r={11}
          fill="rgb(var(--surface-raised))"
          stroke="rgb(var(--accent))"
          strokeWidth={3}
          initial={false}
          animate={{ cx: knobX, cy: knobY }}
          transition={{ duration: 0.12 }}
          style={{ filter: 'drop-shadow(0 0 8px rgb(var(--accent) / 0.7))' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
}
