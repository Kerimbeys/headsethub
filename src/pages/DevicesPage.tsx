import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bluetooth, Usb, Plug, Headphones, MoreHorizontal, Edit3, Trash2, PlugZap, MonitorSpeaker, Star } from 'lucide-react';
import { useDevices } from '@/hooks/useAudioData';
import { useTranslation } from '@/hooks/useTranslation';
import { bridge } from '@/api/bridge';
import { useUi } from '@/store/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { BatteryPill } from '@/components/ui/BatteryPill';
import { SignalBars } from '@/components/ui/SignalBars';
import { DeviceImage } from '@/components/ui/DeviceImage';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { deviceLabel } from '@/utils';

const ICON_MAP: Record<string, typeof Bluetooth> = {
  bluetooth: Bluetooth,
  usb: Usb,
  jack: Plug,
  internal: MonitorSpeaker,
};

/** Devices page — grid of every known audio device with full management. */
export function DevicesPage() {
  const devices = useDevices();
  const { t } = useTranslation();
  const setPage = useUi((s) => s.setPage);
  const openRename = useUi((s) => s.openRename);
  const closeRename = useUi((s) => s.closeRename);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const renameDevice = useUi((s) => s.renameTargetId);
  // We handle rename locally when renameTargetId changes
  const target = devices.find((d) => d.id === renameDevice);

  // Sync local input with target
  if (renameDevice && !renamingId) {
    setRenamingId(renameDevice);
    setNewName(target?.customName ?? target?.name ?? '');
  }

  const performRename = async () => {
    if (!renameDevice) return;
    await bridge.devices.rename(renameDevice, newName.trim().length > 0 ? newName.trim() : null);
    closeRename();
    setRenamingId(null);
    setNewName('');
  };

  return (
    <div className="p-6">
      <PageHeader
        title={t('devices.title')}
        subtitle={t('devices.subtitle')}
        actions={
          <>
            <Button variant="subtle" onClick={() => setPage('bluetooth')}>
              <Bluetooth size={15} /> Bluetooth
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((d, i) => {
          const ConnIcon = ICON_MAP[d.connection] ?? Headphones;
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <GlassCard gradient hoverable>
                <div className="flex items-start gap-3">
                  <DeviceImage imageKey={d.imageKey} size={72} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold">{deviceLabel(d)}</h3>
                      {d.isDefault && (
                        <span title="Varsayılan çıkış" className="text-amber-400"><Star size={14} fill="currentColor" /></span>
                      )}
                      {d.isDefaultComm && (
                        <span title="İletişim cihazı" className="text-sky-400"><Headphones size={14} /></span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-ink-faint">{d.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                      <Badge tone={d.status === 'connected' ? 'success' : d.status === 'pairing' || d.status === 'reconnecting' ? 'warning' : 'danger'}>
                        {t(`status.${d.status}`)}
                      </Badge>
                      <span className="flex items-center gap-1 text-ink-dim"><ConnIcon size={11} /> {d.connection}</span>
                      {d.codec && <Badge>{d.codec}</Badge>}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="mt-4 space-y-3">
                  {d.battery.combined !== null && d.battery.combined !== undefined && (
                    <div className="flex items-center justify-between">
                      <BatteryPill level={d.battery.combined} charging={d.battery.charging} />
                      {d.battery.left !== null && (
                        <div className="flex gap-2 text-[11px]">
                          <span>{t('common.left')}: {d.battery.left}%</span>
                          <span>{t('common.right')}: {d.battery.right}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {d.status === 'connected' && d.signalStrength !== null && d.signalStrength !== undefined && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-dim">{t('common.signal')}</span>
                      <div className="flex items-center gap-2">
                        <SignalBars rssi={d.rssi} />
                        <span className="text-ink-dim">{d.rssi} dBm</span>
                      </div>
                    </div>
                  )}

                  {d.bluetoothVersion && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-dim">Bluetooth</span>
                      <span className="font-medium">{d.bluetoothVersion}</span>
                    </div>
                  )}

                  {d.latencyMs !== null && d.latencyMs !== undefined && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-dim">{t('common.latency')}</span>
                      <span className="font-medium">{d.latencyMs} ms</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-ink-dim w-24">{t('common.sampleRate')}</span>
                    <span>{(d.sampleRate / 1000).toFixed(0)} kHz</span>
                    <span className="text-ink-faint">·</span>
                    <span className="text-ink-dim w-24">{t('common.bitDepth')}</span>
                    <span>{d.bitDepth}-bit</span>
                  </div>

                  {/* Volume slider */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-ink-dim">{t('common.volume')}</span>
                      <span className="font-semibold tabular-nums">{d.muted ? '—' : `${d.volume}%`}</span>
                    </div>
                    <Slider
                      value={d.muted ? 0 : d.volume}
                      onChange={(v) => void bridge.devices.setVolume(d.id, v)}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {d.status === 'connected' ? (
                    <>
                      <Button variant="subtle" size="sm" onClick={() => void bridge.devices.disconnect(d.id)}>
                        <MoreHorizontal size={12} /> {t('common.disconnect')}
                      </Button>
                      {!d.isDefault && (
                        <Button variant="primary" size="sm" onClick={() => void bridge.devices.setDefault(d.id)}>
                          <Star size={12} /> {t('common.setDefault')}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => void bridge.devices.connect(d.id)}>
                      <PlugZap size={12} /> {t('common.connect')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openRename(d.id)}
                  >
                    <Edit3 size={12} /> {t('common.rename')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => void bridge.devices.forget(d.id)}
                  >
                    <Trash2 size={12} /> {t('common.forget')}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Rename modal */}
      <Modal open={!!renameDevice} title={t('devices.renameTitle')} onClose={closeRename}>
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('devices.renamePlaceholder')}
          className="glass-subtle h-10 w-full rounded-control px-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void performRename();
            if (e.key === 'Escape') closeRename();
          }}
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={closeRename}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={() => void performRename()}>{t('common.save')}</Button>
        </div>
      </Modal>
    </div>
  );
}
