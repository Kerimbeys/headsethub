import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-accent-glow hover:brightness-110 border border-transparent',
  ghost:
    'bg-transparent text-ink-dim hover:text-ink hover:bg-[rgb(var(--stroke)/0.06)] border border-transparent',
  danger:
    'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20',
  subtle:
    'glass-subtle text-ink hover:bg-[rgb(var(--surface-overlay)/0.8)]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
  icon: 'h-9 w-9 p-0',
};

/** Animated, premium-feel button. */
export function Button({ children, variant = 'subtle', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={cn(
        'inline-flex items-center justify-center rounded-control font-medium select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        'disabled:opacity-45 disabled:pointer-events-none transition-colors',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
