import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Headphones, Search, RotateCcw, Activity, Zap, AlertTriangle, CheckCircle2, Play, Square,
  Speaker, Waves, CircleDot, Gauge,
} from 'lucide-react';
import { useDevices } from '@/hooks/useAudioData';
import { useTranslation } from '@/hooks/useTranslation';
import { bridge } from '@/api/bridge';
import { useSoundTest, type SoundTestKind } from '@/hooks/useSoundTest';
import type { DiagnosticsReport } from '@/types/audio';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn, deviceLabel } from '@/utils';

/** Tools page — headphone finder, firmware/driver check, diagnostics, sound tests. */
export function ToolsPage() {
  const { t } = useTranslation();
  const devices = useDevices();
  const deviceOptions: SelectOption[] = devices.map((d) => ({ value: d.id, label: deviceLabel(d) }));
  const [selectedId, setSelectedId] = useState<string>(devices[0]?.id ?? '');

  // Headphone finder
  const [finderActive, setFinderActive] = useState(false);
  // Firmware / driver check
  const [fwChecking, setFwChecking] = useState(false);
  const [fwResult, setFwResult] = useState<'upToDate' | 'update' | null>(null);
  // Service restart
  const [restarting, setRestarting] = useState(false);
  const [restarted, setRestarted] = useState(false);
  // Diagnostics
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagReport, setDiagReport] = useState<DiagnosticsReport | null>(null);
  // Sound tests
  const { running, play, stop, latencyResult } = useSoundTest();

  const currentDevice = devices.find((d) => d.id === selectedId);

  const checkFirmware = async () => {
    setFwChecking(true);
    await new Promise((r) => setTimeout(r, 1800));
    setFwResult(currentDevice?.firmwareVersion !== '1.0.0' ? 'upToDate' : 'update');
    setFwChecking(false);
  };

  const restartService = async () => {
    setRestarting(true);
    const ok = await bridge.audio.restartService();
    setRestarting(false);
    if (ok) {
      setRestarted(true);
      setTimeout(() => setRestarted(false), 4000);
    }
  };

  const runDiagnostics = async () => {
    if (!selectedId) return;
    setDiagRunning(true);
    const report = await bridge.devices.diagnostics(selectedId);
    setDiagReport(report);
    setDiagRunning(false);
  };

  const playTest = (kind: SoundTestKind) => {
    if (running === kind) {
      stop();
    } else {
      play(kind);
    }
  };

  return (
    <div className="p-6">
      <PageHeader title={t('tools.title')} subtitle={t('tools.subtitle')} />

      <div className="mb-4">
        <Select
          value={selectedId}
          options={deviceOptions}
          onChange={setSelectedId}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Headphone Finder */}
        <GlassCard hoverable>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-accent/15 text-accent">
              <Headphones size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('tools.finder')}</h3>
              <p className="text-[11px] text-ink-dim">{t('tools.finderDesc')}</p>
            </div>
          </div>
          <Button
            variant={finderActive ? 'danger' : 'primary'}
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              if (finderActive) {
                stop();
                setFinderActive(false);
              } else {
                play('finder');
                setFinderActive(true);
              }
            }}
          >
            {finderActive ? <><Square size={12} /> {t('tools.stop')}</> : <><Play size={12} /> {t('tools.playSound')}</>}
          </Button>
          {finderActive && (
            <motion.p
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="mt-2 text-center text-xs text-accent"
            >
              {t('tools.playingSound')}
            </motion.p>
          )}
        </GlassCard>

        {/* Firmware Checker */}
        <GlassCard hoverable>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-accent/15 text-accent">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('tools.firmware')}</h3>
              <p className="text-[11px] text-ink-dim">{t('tools.firmwareDesc')}</p>
            </div>
          </div>
          <Button
            variant="subtle"
            size="sm"
            className="mt-3 w-full"
            onClick={checkFirmware}
            disabled={fwChecking}
          >
            <Search size={12} /> {fwChecking ? t('tools.running') : t('tools.checkFirmware')}
          </Button>
          {fwResult && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs">
              {fwResult === 'upToDate' ? (
                <><CheckCircle2 size={13} className="text-emerald-400" /> {t('tools.upToDate')}</>
              ) : (
                <><AlertTriangle size={13} className="text-amber-400" /> {t('tools.updateAvailable')}</>
              )}
            </div>
          )}
        </GlassCard>

        {/* Driver Checker */}
        <GlassCard hoverable>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-accent/15 text-accent">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('tools.driver')}</h3>
              <p className="text-[11px] text-ink-dim">{t('tools.driverDesc')}</p>
            </div>
          </div>
          <div className="mt-3">
            <Badge tone={currentDevice?.driverVersion ? 'success' : 'warning'} className="w-full justify-center">
              {currentDevice?.driverVersion ?? 'Sürücü bilgisi yok'}
            </Badge>
          </div>
        </GlassCard>

        {/* Restart Audio Service */}
        <GlassCard hoverable>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-accent/15 text-accent">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('tools.restartAudio')}</h3>
              <p className="text-[11px] text-ink-dim">{t('tools.restartAudioDesc')}</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="mt-3 w-full"
            onClick={restartService}
            disabled={restarting}
          >
            <RotateCcw size={12} /> {restarting ? t('tools.restarting') : t('tools.restart')}
          </Button>
          {restarted && (
            <p className="mt-2 text-center text-xs text-emerald-400">{t('tools.restarted')}</p>
          )}
        </GlassCard>

        {/* Device Diagnostics */}
        <GlassCard hoverable>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-accent/15 text-accent">
              <Gauge size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('tools.diagnostics')}</h3>
              <p className="text-[11px] text-ink-dim">{t('tools.diagnosticsDesc')}</p>
            </div>
          </div>
          <Button
            variant="subtle"
            size="sm"
            className="mt-3 w-full"
            onClick={runDiagnostics}
            disabled={diagRunning}
          >
            <Gauge size={12} /> {diagRunning ? t('tools.running') : t('tools.runDiagnostics')}
          </Button>
          {diagReport && (
            <div className="mt-3 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-ink-dim">{t('common.latency')}</span>
                <span className="font-semibold tabular-nums">{diagReport.latencyMs} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-dim">Jitter</span>
                <span className="font-semibold tabular-nums">{diagReport.jitterMs} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-dim">Paket Kaybı</span>
                <span className="font-semibold tabular-nums">%{diagReport.packetLoss}</span>
              </div>
              {diagReport.issues.length > 0 && (
                <div className="mt-2 space-y-1">
                  {diagReport.issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle size={11} /> {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </GlassCard>

        {/* Sound Tests */}
        <GlassCard hoverable>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-accent/15 text-accent">
              <Waves size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('tools.soundTests')}</h3>
              <p className="text-[11px] text-ink-dim">Cihazınızı test edin</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <TestButton label={t('tools.leftRight')} icon={Speaker} running={running === 'left' || running === 'right'} onClick={() => playTest('left')} />
            <TestButton label={t('tools.bass')} icon={CircleDot} running={running === 'bass'} onClick={() => playTest('bass')} />
            <TestButton label={t('tools.treble')} icon={Waves} running={running === 'treble'} onClick={() => playTest('treble')} />
            <TestButton label={t('tools.surround')} icon={Activity} running={running === 'surround'} onClick={() => playTest('surround')} />
          </div>
          {latencyResult !== null && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs">
              <Gauge size={12} className="text-accent" />
              <span>Son ölçülen gecikme: <strong className="tabular-nums">{latencyResult} ms</strong></span>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function TestButton({ label, icon: Icon, running, onClick }: { label: string; icon: typeof Play; running: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-control px-2 py-2 text-xs font-medium transition-colors',
        running ? 'bg-accent/20 text-accent' : 'glass-subtle text-ink-dim hover:text-ink',
      )}
    >
      {running ? <Square size={12} /> : <Icon size={12} />}
      {label}
    </button>
  );
}
