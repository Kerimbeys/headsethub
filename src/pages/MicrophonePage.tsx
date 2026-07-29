import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Activity, Sparkles, Zap, KeyRound, Volume2 } from 'lucide-react';
import { useMicState } from '@/hooks/useAudioData';
import { useTranslation } from '@/hooks/useTranslation';
import { bridge } from '@/api/bridge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/utils';

type TestState = 'idle' | 'recording' | 'playing' | 'done';

/** Microphone page — gain, noise suppression, PTT, live waveform, mic test. */
export function MicrophonePage() {
  const mic = useMicState();
  const { t } = useTranslation();
  const [testState, setTestState] = useState<TestState>('idle');
  const [testDuration, setTestDuration] = useState(0);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const levelsRef = useRef<number[]>(new Array(60).fill(0));
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // Live waveform drawing
  useEffect(() => {
    if (!waveformRef.current) return;
    const canvas = waveformRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const levels = levelsRef.current;
      const step = w / (levels.length - 1);
      ctx.beginPath();
      ctx.strokeStyle = 'rgb(var(--accent))';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      for (let i = 0; i < levels.length; i += 1) {
        const x = i * step;
        const amp = (levels[i] / 100) * (h * 0.4);
        const y = h / 2 + Math.sin(i * 0.6 + Date.now() / 180) * amp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Glow fill
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(var(--accent), 0.08)';
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Analyser-driven level updates
  useEffect(() => {
    if (!mic || !mic.deviceId) return;
    // Try to get real microphone if available
    const startStream = async () => {
      try {
        if (!streamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;
          const data = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            const level = Math.round((avg / 255) * 100);
            const arr = levelsRef.current;
            arr.push(level);
            if (arr.length > 60) arr.shift();
            rafRef.current = requestAnimationFrame(tick);
          };
          tick();
        }
      } catch {
        // Browser doesn't have mic access — levels will come from mic inputLevel simulation
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const tick = () => {
          const arr = levelsRef.current;
          arr.push(mic.inputLevel);
          if (arr.length > 60) arr.shift();
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      }
    };
    void startStream();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [mic?.deviceId]);

  const startTest = async () => {
    setTestState('recording');
    setTestDuration(0);
    timerRef.current = window.setInterval(() => {
      setTestDuration((t) => {
        if (t >= 4) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTestState('playing');
          setTimeout(() => setTestState('done'), 3000);
          return t;
        }
        return t + 1;
      });
    }, 1000);
  };

  const stopTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTestState('idle');
    setTestDuration(0);
  };

  const inputLevel = mic?.inputLevel ?? 0;
  const noiseOn = mic?.noiseSuppression ?? false;
  const ptm = mic?.pushToTalk ?? false;

  return (
    <div className="p-6">
      <PageHeader title={t('mic.title')} subtitle={t('mic.subtitle')} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left column */}
        <GlassCard>
          <h3 className="text-sm font-semibold">{t('mic.liveWaveform')}</h3>
          <canvas
            ref={waveformRef}
            className="mt-3 h-32 w-full rounded-control bg-[rgb(var(--surface)/0.5)]"
          />
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-ink-dim">{t('mic.inputLevel')}</span>
            <span className="tabular-nums font-semibold">{inputLevel}%</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-[rgb(var(--stroke)/0.1)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400"
              animate={{ width: `${inputLevel}%` }}
              transition={{ duration: 0.08 }}
            />
          </div>
        </GlassCard>

        {/* Right column */}
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-accent" />
                  <h3 className="text-sm font-semibold">{t('mic.noiseSuppression')}</h3>
                </div>
                <p className="mt-1 text-[11px] text-ink-dim">{t('mic.noiseSuppressionDesc')}</p>
              </div>
              <Toggle checked={noiseOn} onChange={(v) => void bridge.mic.update({ noiseSuppression: v })} />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound size={15} className="text-accent" />
                  <h3 className="text-sm font-semibold">{t('mic.pushToTalk')}</h3>
                </div>
                <p className="mt-1 text-[11px] text-ink-dim">{t('mic.pushToTalkDesc')}</p>
              </div>
              <Toggle checked={ptm} onChange={(v) => void bridge.mic.update({ pushToTalk: v })} />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-accent" />
                <span className="text-sm font-semibold">{t('mic.gain')}</span>
              </div>
              <span className="text-xs font-semibold tabular-nums">{mic?.gain ?? 0} dB</span>
            </div>
            <Slider
              value={mic?.gain ?? 0}
              min={-12}
              max={24}
              step={1}
              onChange={(v) => void bridge.mic.update({ gain: v })}
              className="mt-3"
            />
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={15} className="text-accent" />
                <span className="text-sm font-semibold">{t('common.volume')}</span>
              </div>
              <span className="text-xs font-semibold tabular-nums">{mic?.volume ?? 0}%</span>
            </div>
            <Slider
              value={mic?.volume ?? 0}
              onChange={(v) => void bridge.mic.update({ volume: v })}
              className="mt-3"
            />
          </GlassCard>
        </div>

        {/* Test area */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-accent" />
              <h3 className="text-sm font-semibold">{t('mic.test')}</h3>
            </div>
            <div className="flex items-center gap-2">
              {testState === 'idle' && (
                <Button variant="primary" onClick={startTest}><Mic size={14} /> {t('mic.startTest')}</Button>
              )}
              {(testState === 'recording' || testState === 'playing') && (
                <Button variant="danger" onClick={stopTest}>{t('tools.stop')}</Button>
              )}
              {testState === 'done' && (
                <Button variant="subtle" onClick={() => setTestState('idle')}>{t('common.close')}</Button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-1 h-16 items-end">
            {Array.from({ length: 20 }, (_, i) => {
              const height = testState === 'idle' ? 4 : Math.max(4, Math.random() * 60);
              return (
                <motion.div
                  key={i}
                  className={cn(
                    'rounded-t-sm w-full',
                    testState === 'recording' ? 'bg-accent' : 'bg-[rgb(var(--stroke)/0.12)]',
                  )}
                  animate={{ height: testState === 'recording' ? height : 4 }}
                  transition={{ duration: 0.15 }}
                />
              );
            })}
          </div>

          <p className="mt-3 text-xs text-ink-dim">
            {testState === 'idle' && 'Kaydı başlatmak için butona basın.'}
            {testState === 'recording' && `${t('mic.testRunning')} (${testDuration}s / 5s)`}
            {testState === 'playing' && t('mic.testDone')}
            {testState === 'done' && 'Test tamamlandı.'}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
