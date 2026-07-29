import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils';
import type { ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  gradient?: boolean;
  hoverable?: boolean;
  className?: string;
}

/** Frosted glass card — the base surface of HeadsetHub. */
export function GlassCard({ children, gradient = false, hoverable = false, className, ...rest }: GlassCardProps) {
  return (
    <motion.div
      className={cn('glass p-5', gradient && 'gradient-border', className)}
      whileHover={
        hoverable
          ? { y: -3, boxShadow: '0 16px 40px rgb(0 0 0 / 0.45)', transition: { duration: 0.2 } }
          : undefined
      }
      {...rest}
    >
      {children}
    </motion.div>
  );
}
