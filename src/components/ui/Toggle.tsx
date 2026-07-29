import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/** Fluent-style animated toggle switch. */
export function Toggle({ checked, onChange, disabled = false, className }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        checked ? 'bg-accent shadow-accent-glow' : 'bg-[rgb(var(--stroke)/0.15)]',
        disabled && 'opacity-40 pointer-events-none',
        className,
      )}
    >
      <motion.span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 550, damping: 32 }}
      />
    </button>
  );
}
