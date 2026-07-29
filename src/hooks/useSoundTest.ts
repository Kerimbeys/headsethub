import { useCallback, useRef, useState } from 'react';

export type SoundTestKind = 'left' | 'right' | 'bass' | 'treble' | 'surround' | 'finder' | 'latency';

/**
 * Real audio test signals generated with the Web Audio API.
 * Works everywhere (Electron renderer is Chromium).
 */
export function useSoundTest(): {
  running: SoundTestKind | null;
  play: (kind: SoundTestKind) => void;
  stop: () => void;
  latencyResult: number | null;
} {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const timerRef = useRef<number | null>(null);
  const [running, setRunning] = useState<SoundTestKind | null>(null);
  const [latencyResult, setLatencyResult] = useState<number | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    for (const n of nodesRef.current) {
      try {
        if (n instanceof OscillatorNode) n.stop();
        n.disconnect();
      } catch {
        /* already stopped */
      }
    }
    nodesRef.current = [];
    setRunning(null);
  }, []);

  const play = useCallback(
    (kind: SoundTestKind) => {
      stop();
      const ctx = ctxRef.current ?? new AudioContext();
      ctxRef.current = ctx;
      void ctx.resume();
      setRunning(kind);

      const master = ctx.createGain();
      master.gain.value = 0.25;
      master.connect(ctx.destination);
      nodesRef.current.push(master);

      const scheduleStop = (ms: number) => {
        timerRef.current = window.setTimeout(() => stop(), ms);
      };

      switch (kind) {
        case 'left':
        case 'right': {
          const osc = ctx.createOscillator();
          osc.frequency.value = 440;
          const panner = ctx.createStereoPanner();
          panner.pan.value = kind === 'left' ? -1 : 1;
          osc.connect(panner).connect(master);
          osc.start();
          nodesRef.current.push(osc, panner);
          scheduleStop(2000);
          break;
        }
        case 'bass': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(40, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 3);
          osc.connect(master);
          osc.start();
          nodesRef.current.push(osc);
          scheduleStop(3200);
          break;
        }
        case 'treble': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(4000, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(14000, ctx.currentTime + 3);
          osc.connect(master);
          osc.start();
          nodesRef.current.push(osc);
          scheduleStop(3200);
          break;
        }
        case 'surround': {
          const osc = ctx.createOscillator();
          osc.frequency.value = 520;
          const panner = ctx.createStereoPanner();
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.4;
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 1;
          lfo.connect(lfoGain).connect(panner.pan);
          osc.connect(panner).connect(master);
          osc.start();
          lfo.start();
          nodesRef.current.push(osc, panner, lfo, lfoGain);
          scheduleStop(6000);
          break;
        }
        case 'finder': {
          // Loud chirping beacon to locate the device.
          const osc = ctx.createOscillator();
          osc.type = 'square';
          const gain = ctx.createGain();
          gain.gain.value = 0;
          for (let i = 0; i < 8; i += 1) {
            const t = ctx.currentTime + i * 0.5;
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.setValueAtTime(0, t + 0.25);
            osc.frequency.setValueAtTime(i % 2 === 0 ? 2200 : 2800, t);
          }
          osc.connect(gain).connect(master);
          osc.start();
          nodesRef.current.push(osc, gain);
          scheduleStop(4200);
          break;
        }
        case 'latency': {
          // Emit a click and measure context output latency.
          const osc = ctx.createOscillator();
          osc.frequency.value = 1000;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.6, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
          osc.connect(gain).connect(master);
          osc.start();
          nodesRef.current.push(osc, gain);
          const base = (ctx.baseLatency ?? 0) * 1000;
          const output = ((ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0) * 1000;
          setLatencyResult(Math.round((base + output + 2) * 10) / 10);
          scheduleStop(600);
          break;
        }
      }
    },
    [stop],
  );

  return { running, play, stop, latencyResult };
}
