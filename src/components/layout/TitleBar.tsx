import { Minus, Square, X, Headphones } from 'lucide-react';
import { bridge, isElectron } from '@/api/bridge';
import { useSystemInfo } from '@/hooks/useAudioData';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/Badge';

/** Custom frameless window title bar with drag region and window controls. */
export function TitleBar() {
  const info = useSystemInfo();
  const { t } = useTranslation();

  return (
    <header className="drag-region relative z-20 flex h-11 shrink-0 items-center justify-between pl-4 pr-1">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 text-accent">
          <Headphones size={14} strokeWidth={2.4} />
        </span>
        <span className="text-[13px] font-semibold tracking-wide">HeadsetHub</span>
        {info?.simulated && (
          <span className="no-drag" title={t('sim.tooltip')}>
            <Badge tone="accent">{t('sim.badge')}</Badge>
          </span>
        )}
      </div>
      {isElectron && (
        <div className="no-drag flex items-center">
          <button
            className="flex h-11 w-12 items-center justify-center text-ink-dim transition-colors hover:bg-[rgb(var(--stroke)/0.08)] hover:text-ink"
            onClick={() => void bridge.window.minimize()}
            aria-label="minimize"
          >
            <Minus size={15} />
          </button>
          <button
            className="flex h-11 w-12 items-center justify-center text-ink-dim transition-colors hover:bg-[rgb(var(--stroke)/0.08)] hover:text-ink"
            onClick={() => void bridge.window.maximize()}
            aria-label="maximize"
          >
            <Square size={13} />
          </button>
          <button
            className="flex h-11 w-12 items-center justify-center text-ink-dim transition-colors hover:bg-red-500 hover:text-white"
            onClick={() => void bridge.window.close()}
            aria-label="close"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
