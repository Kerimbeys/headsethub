import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, Headphones, X } from 'lucide-react';
import { useUi, type Toast } from '@/store/ui';
import { BatteryPill } from '@/components/ui/BatteryPill';
import { cn } from '@/utils';

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  device: Headphones,
} as const;

const COLORS = {
  success: 'text-emerald-400',
  info: 'text-sky-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
  device: 'text-accent',
} as const;

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useUi((s) => s.dismissToast);
  const Icon = ICONS[toast.kind];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="glass gradient-border pointer-events-auto flex w-80 items-start gap-3 p-4 shadow-glass"
    >
      <span className={cn('mt-0.5', COLORS[toast.kind])}>
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.body && <p className="mt-0.5 truncate text-xs text-ink-dim">{toast.body}</p>}
        {toast.battery !== undefined && toast.battery !== null && (
          <BatteryPill level={toast.battery} className="mt-1.5 text-xs" />
        )}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="text-ink-faint transition-colors hover:text-ink"
        aria-label="dismiss"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

/** Fixed stack of animated in-app notifications (top right). */
export function ToastHost() {
  const toasts = useUi((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed right-5 top-14 z-50 flex flex-col gap-2.5">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
