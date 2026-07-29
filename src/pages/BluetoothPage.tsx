import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bluetooth, Search, CheckCircle2, Radio, Zap } from 'lucide-react';
import { useDevices } from '@/hooks/useAudioData';
import { useSettings } from '@/store/settings';
import { useTranslation } from '@/hooks/useTranslation';
import { bridge } from '@/api/bridge';
import type { BluetoothScanResult, AudioDevice } from '@/types/audio';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { DeviceImage } from '@/components/ui/DeviceImage';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { SignalBars } from '@/components/ui/SignalBars';
import { deviceLabel } from '@/utils';

type PairingProgress = Record<string, 'idle' | 'pairing' | 'done'>;

/** Bluetooth Manager — scan, pair, manage paired devices. */
export function BluetoothPage() {
  const { t } = useTranslation();
  const devices = useDevices();
  const autoReconnect = useSettings((s) => s.autoReconnect);
  const setAutoReconnect = useSettings((s) => s.setAutoReconnect);

  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<BluetoothScanResult[]>([]);
  const [pairing, setPairing] = useState<PairingProgress>({});

  const btDevices = devices.filter((d) => d.connection === 'bluetooth');
  const paired = btDevices.filter((d) => d.status !== 'disconnected' || d.battery.combined !== null);

  useEffect(() => {
    const offResult = bridge.bluetooth.onScanResult((r) => {
      setScanResults((prev) => {
        const exists = prev.find((p) => p.address === r.address);
        return exists ? prev.map((p) => (p.address === r.address ? r : p)) : [...prev, r];
      });
    });
    const offFinish = bridge.bluetooth.onScanFinished(() => {
      setScanning(false);
    });
    return () => {
      offResult();
      offFinish();
    };
  }, []);

  useEffect(() => {
    // Track pairing progress by looking for newly added devices
    for (const addr of Object.keys(pairing)) {
      if (pairing[addr] === 'pairing') {
        const found = devices.find((d) => d.id.toLowerCase().includes(addr.replace(/:/g, '').toLowerCase()));
        if (found && found.status === 'connected') {
          setPairing((p) => ({ ...p, [addr]: 'done' }));
        }
      }
    }
  }, [devices, pairing]);

  const startScan = () => {
    setScanning(true);
    setScanResults([]);
    setPairing({});
    void bridge.bluetooth.scan();
  };

  const pairDevice = (r: BluetoothScanResult) => {
    setPairing((p) => ({ ...p, [r.address]: 'pairing' }));
    void bridge.bluetooth.pair(r);
  };

  const statusFor = (device: AudioDevice): 'idle' | 'pairing' | 'done' | 'connected' => {
    if (device.status === 'connected') return 'connected';
    const addrKey = Object.keys(pairing).find((k) => device.id.toLowerCase().includes(k.replace(/:/g, '').toLowerCase()));
    if (addrKey) return pairing[addrKey];
    return 'idle';
  };

  return (
    <div className="p-6">
      <PageHeader
        title={t('bt.title')}
        subtitle={t('bt.subtitle')}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-ink-dim">
              <Zap size={13} /> {t('bt.autoReconnect')}
              <Toggle checked={autoReconnect} onChange={setAutoReconnect} />
            </div>
            <Button variant="primary" onClick={startScan} disabled={scanning}>
              <Search size={14} /> {scanning ? t('bt.scanning') : t('bt.scan')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Paired devices */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-dim">{t('bt.paired')}</h2>
          {paired.length === 0 ? (
            <GlassCard>
              <p className="text-sm text-ink-dim">Henüz eşleştirilmiş cihaz yok.</p>
            </GlassCard>
          ) : (
            paired.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard hoverable>
                  <div className="flex items-center gap-4">
                    <DeviceImage imageKey={d.imageKey} size={64} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold">{deviceLabel(d)}</h3>
                        {statusFor(d) === 'connected' ? (
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        ) : statusFor(d) === 'pairing' ? (
                          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                            <Radio size={14} className="text-amber-400" />
                          </motion.span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-ink-faint">{d.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        <Badge tone={d.status === 'connected' ? 'success' : 'neutral'}>
                          {t(`status.${d.status}`)}
                        </Badge>
                        {d.codec && <Badge>{d.codec}</Badge>}
                        {d.rssi !== null && d.rssi !== undefined && (
                          <div className="flex items-center gap-1.5 text-ink-dim">
                            <SignalBars rssi={d.rssi} />
                            <span>{d.rssi} dBm</span>
                          </div>
                        )}
                        {d.battery.combined !== null && d.battery.combined !== undefined && (
                          <span className="tabular-nums">Pil %{d.battery.combined}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {d.status === 'connected' ? (
                        <Button variant="subtle" size="sm" onClick={() => void bridge.devices.disconnect(d.id)}>
                          {t('common.disconnect')}
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm" onClick={() => void bridge.devices.connect(d.id)}>
                          {t('common.connect')}
                        </Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => void bridge.devices.forget(d.id)}>
                        {t('common.forget')}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>

        {/* Scan results */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-dim">{t('bt.nearby')}</h2>
          <GlassCard className="min-h-[300px]">
            {scanning && (
              <div className="mb-3 flex items-center gap-2 text-sm">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="text-accent"
                >
                  <Search size={16} />
                </motion.span>
                <span className="text-accent">{t('bt.scanning')}</span>
              </div>
            )}
            {scanResults.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-ink-dim">
                {t('bt.noResults')}
              </div>
            ) : (
              <div className="space-y-2">
                {scanResults.map((r) => (
                  <div key={r.address} className="glass-subtle flex items-center gap-3 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-control bg-accent/15 text-accent">
                      <Bluetooth size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-dim">
                        <SignalBars rssi={r.rssi} />
                        <span>{r.rssi} dBm</span>
                        <span>· {r.kind}</span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={pairing[r.address] !== undefined && pairing[r.address] !== 'idle'}
                      onClick={() => pairDevice(r)}
                    >
                      {pairing[r.address] === 'pairing' ? t('status.pairing') : t('bt.pair')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
