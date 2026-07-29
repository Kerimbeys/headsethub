import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;
}

/** Custom glass dropdown select. */
export function Select({ value, options, onChange, className, compact = false }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'glass-subtle flex w-full items-center justify-between gap-2 text-left transition-colors hover:bg-[rgb(var(--surface-overlay)/0.8)]',
          compact ? 'h-8 px-2.5 text-xs' : 'h-10 px-3.5 text-sm',
        )}
      >
        <span className="truncate">{current?.label ?? '—'}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={compact ? 14 : 16} className="text-ink-faint" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="glass absolute z-40 mt-1.5 max-h-56 w-full min-w-[180px] overflow-auto p-1.5 shadow-glass"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            {options.map((o) => (
              <li key={o.value}>
                <button
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-control px-3 py-2 text-sm transition-colors',
                    o.value === value ? 'bg-accent/15 text-accent' : 'hover:bg-[rgb(var(--stroke)/0.06)]',
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check size={14} />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
