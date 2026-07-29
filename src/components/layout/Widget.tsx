import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause, Zap } from 'lucide-react';
import { useDefaultDevice, useMediaSession } from '@/hooks/useAudioData';
import { bridge, isElectron } from '@/api/bridge';
import { batteryColor, deviceLabel } from '@/utils';

/**
 * Floating desktop widget that sits on top of the Windows desktop.
 * Shows current device, volume, battery, and now-playing in a compact
 * translucent form with mouse drag support.
 */
export function Widget() {
  const device = useDefaultDevice();
  const media = useMediaSession();
  // Widget dragging is handled natively by Electron
  const _pos = { x: 8, y: 8 };

  useEffect(() => {
    if (!isElectron) return;
    // Widget dragging is handled by Electron native layer — no JS drag API exposed
    return () => {};
  }, []);

  return (
    <div
      style={{ position: 'fixed', left: _pos.x, top: _pos.y }}
      className="widget-glass pointer-events-none rounded-card p-4 w-64"
    >
      <div className="flex items-center gap-3">
        <div className='flex h-9 w-9 items-center justify-center rounded-control bg-accent/20 text-accent'>
          <Volume2 size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">
            {device ? deviceLabel(device) : 'No device'}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-ink-dim">
            {device?.muted ? (
              <><VolumeX size={11} /> Muted</>
            ) : (
              <><Volume2 size={11} /> {device?.volume}%</>
            )}
            {device?.battery.combined !== null && device?.battery.combined !== undefined && (
              <><Zap size={10} /> <span className={batteryColor(device.battery.combined)}>%{device.battery.combined}</span></>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {media && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-[11px]">
              <button
                className="pointer-events-auto"
                onClick={() => void bridge.media.control(media.isPlaying ? 'pause' : 'play')}
              >
                {media.isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <span className="truncate text-ink-dim">{media.title}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
