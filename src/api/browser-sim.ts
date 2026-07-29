/**
 * Browser-side simulation of the HeadsetHub bridge.
 * Mirrors the Electron main-process AudioEngine so the full UI works
 * even without Electron (dev in a browser tab, demos, tests).
 */

import type {
  AudioDevice,
  AppAudioSession,
  BluetoothScanResult,
  MediaSessionInfo,
  MicState,
  BatterySample,
  DiagnosticsReport,
  CodecName,
} from '@/types/audio';
import type { HeadsetHubBridge } from './bridge';

type AnyListener = (payload: never) => void;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function jitter(base: number, spread: number): number {
  return base + (Math.random() - 0.5) * spread;
}

const SIM_DEVICES: AudioDevice[] = [
  {
    id: 'bt-jbl-wave-buds-2',
    name: 'JBL Wave Buds 2',
    customName: null,
    kind: 'earbuds',
    connection: 'bluetooth',
    status: 'connected',
    isDefault: true,
    isDefaultComm: false,
    battery: { left: 82, right: 78, case: 64, combined: 80, charging: false },
    signalStrength: 88,
    rssi: -52,
    bluetoothVersion: '5.3',
    codec: 'AAC',
    latencyMs: 58,
    sampleRate: 48000,
    bitDepth: 16,
    volume: 65,
    muted: false,
    imageKey: 'earbuds',
    firmwareVersion: '2.4.1',
    driverVersion: '10.0.22621.1',
  },
  {
    id: 'bt-sony-wh1000xm5',
    name: 'Sony WH-1000XM5',
    customName: null,
    kind: 'headset',
    connection: 'bluetooth',
    status: 'connected',
    isDefault: false,
    isDefaultComm: true,
    battery: { left: null, right: null, case: null, combined: 54, charging: false },
    signalStrength: 72,
    rssi: -63,
    bluetoothVersion: '5.2',
    codec: 'LDAC',
    latencyMs: 112,
    sampleRate: 96000,
    bitDepth: 24,
    volume: 48,
    muted: false,
    imageKey: 'headset',
    firmwareVersion: '1.9.0',
    driverVersion: '10.0.22621.1',
  },
  {
    id: 'usb-hyperx-quadcast',
    name: 'HyperX QuadCast S',
    customName: null,
    kind: 'microphone',
    connection: 'usb',
    status: 'connected',
    isDefault: false,
    isDefaultComm: false,
    battery: { left: null, right: null, case: null, combined: null, charging: false },
    signalStrength: null,
    rssi: null,
    bluetoothVersion: null,
    codec: 'PCM',
    latencyMs: 8,
    sampleRate: 48000,
    bitDepth: 24,
    volume: 74,
    muted: false,
    imageKey: 'microphone',
    firmwareVersion: '0.0.36',
    driverVersion: '10.0.22621.2506',
  },
  {
    id: 'jack-edifier-r1280t',
    name: 'Edifier R1280T',
    customName: 'Masa Hoparlörleri',
    kind: 'speaker',
    connection: 'jack',
    status: 'connected',
    isDefault: false,
    isDefaultComm: false,
    battery: { left: null, right: null, case: null, combined: null, charging: false },
    signalStrength: null,
    rssi: null,
    bluetoothVersion: null,
    codec: 'PCM',
    latencyMs: 4,
    sampleRate: 44100,
    bitDepth: 16,
    volume: 32,
    muted: false,
    imageKey: 'speaker',
    firmwareVersion: null,
    driverVersion: '10.0.22621.1',
  },
  {
    id: 'bt-galaxy-buds-3-pro',
    name: 'Galaxy Buds 3 Pro',
    customName: null,
    kind: 'earbuds',
    connection: 'bluetooth',
    status: 'disconnected',
    isDefault: false,
    isDefaultComm: false,
    battery: { left: 100, right: 100, case: 91, combined: 100, charging: true },
    signalStrength: null,
    rssi: null,
    bluetoothVersion: '5.4',
    codec: null,
    latencyMs: null,
    sampleRate: 48000,
    bitDepth: 24,
    volume: 50,
    muted: false,
    imageKey: 'earbuds-2',
    firmwareVersion: 'R630XXU0AXH7',
    driverVersion: null,
  },
];

const SIM_SESSIONS: AppAudioSession[] = [
  { id: 'spotify', appName: 'Spotify.exe', displayName: 'Spotify', iconKey: 'spotify', volume: 70, muted: false, peak: 0, outputDeviceId: 'bt-jbl-wave-buds-2' },
  { id: 'discord', appName: 'Discord.exe', displayName: 'Discord', iconKey: 'discord', volume: 85, muted: false, peak: 0, outputDeviceId: 'bt-sony-wh1000xm5' },
  { id: 'chrome', appName: 'chrome.exe', displayName: 'Google Chrome', iconKey: 'chrome', volume: 55, muted: false, peak: 0, outputDeviceId: 'bt-jbl-wave-buds-2' },
  { id: 'obs', appName: 'obs64.exe', displayName: 'OBS Studio', iconKey: 'obs', volume: 100, muted: false, peak: 0, outputDeviceId: 'bt-jbl-wave-buds-2' },
  { id: 'cs2', appName: 'cs2.exe', displayName: 'Counter-Strike 2', iconKey: 'cs2', volume: 90, muted: false, peak: 0, outputDeviceId: 'bt-jbl-wave-buds-2' },
  { id: 'steam', appName: 'steam.exe', displayName: 'Steam', iconKey: 'steam', volume: 40, muted: true, peak: 0, outputDeviceId: 'bt-jbl-wave-buds-2' },
];

const SIM_TRACKS = [
  { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', durationMs: 200040 },
  { title: 'Starboy', artist: 'The Weeknd, Daft Punk', album: 'Starboy', durationMs: 230453 },
  { title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", durationMs: 243960 },
  { title: 'Instant Crush', artist: 'Daft Punk, Julian Casablancas', album: 'Random Access Memories', durationMs: 337560 },
  { title: 'Nightcall', artist: 'Kavinsky', album: 'OutRun', durationMs: 258000 },
];

const SIM_SCAN_POOL: BluetoothScanResult[] = [
  { address: '5C:EB:68:11:22:33', name: 'AirPods Pro 2', rssi: -48, kind: 'earbuds', paired: false },
  { address: '88:C9:E8:44:55:66', name: 'Bose QC Ultra', rssi: -61, kind: 'headset', paired: false },
  { address: 'F4:7B:09:77:88:99', name: 'JBL Flip 6', rssi: -70, kind: 'speaker', paired: false },
  { address: 'AC:80:0A:AA:BB:CC', name: 'Marshall Major IV', rssi: -55, kind: 'headset', paired: false },
  { address: '10:B9:F7:DD:EE:FF', name: 'Soundcore Liberty 4', rssi: -67, kind: 'earbuds', paired: false },
];

export function createBrowserSimulation(): HeadsetHubBridge {
  const listeners = new Map<string, Set<AnyListener>>();
  const devices: AudioDevice[] = JSON.parse(JSON.stringify(SIM_DEVICES));
  const sessions: AppAudioSession[] = JSON.parse(JSON.stringify(SIM_SESSIONS));
  const batteryHistory: BatterySample[] = [];
  const lowBatteryNotified = new Set<string>();
  let trackIndex = 0;
  let mic: MicState = {
    deviceId: 'usb-hyperx-quadcast',
    volume: 74,
    muted: false,
    gain: 12,
    noiseSuppression: true,
    pushToTalk: false,
    pushToTalkKey: 'V',
    inputLevel: 0,
  };
  let media: MediaSessionInfo = {
    isPlaying: true,
    title: SIM_TRACKS[0].title,
    artist: SIM_TRACKS[0].artist,
    album: SIM_TRACKS[0].album,
    albumArtUrl: null,
    positionMs: 42000,
    durationMs: SIM_TRACKS[0].durationMs,
    sourceApp: 'Spotify',
  };

  function emit(channel: string, payload: unknown): void {
    listeners.get(channel)?.forEach((cb) => (cb as (p: unknown) => void)(payload));
  }

  function on<T>(channel: string, cb: (payload: T) => void): () => void {
    if (!listeners.has(channel)) listeners.set(channel, new Set());
    listeners.get(channel)!.add(cb as AnyListener);
    return () => listeners.get(channel)?.delete(cb as AnyListener);
  }

  function nextTrack(): void {
    trackIndex = (trackIndex + 1) % SIM_TRACKS.length;
    const t = SIM_TRACKS[trackIndex];
    media = { ...media, title: t.title, artist: t.artist, album: t.album, positionMs: 0, durationMs: t.durationMs };
    emit('media', media);
  }

  // Seed 7 days of battery history
  (function seed() {
    const now = Date.now();
    const hour = 3600_000;
    for (const d of devices) {
      if (d.battery.combined === null) continue;
      let level = 100;
      for (let t = now - 7 * 24 * hour; t <= now; t += hour) {
        const hod = new Date(t).getHours();
        level -= hod >= 9 && hod <= 23 ? 2 + Math.random() * 3 : 0;
        if (level < 8) level = 100;
        batteryHistory.push({ timestamp: t, deviceId: d.id, level: Math.round(level) });
      }
    }
  })();

  // Live ticks
  setInterval(() => {
    for (const s of sessions) {
      const active = !s.muted && (s.id === 'spotify' ? media.isPlaying : Math.random() > 0.25);
      s.peak = active ? clamp(jitter(s.volume * 0.7, 30), 0, 100) : Math.max(0, s.peak - 25);
    }
    emit('sessions', sessions);

    const talking = !mic.muted && Math.random() > 0.3;
    mic = {
      ...mic,
      inputLevel: talking ? clamp(jitter(45 + mic.gain, 40), 0, 100) : Math.max(0, mic.inputLevel - 20),
    };
    emit('mic', mic);

    for (const d of devices) {
      if (d.status === 'connected' && d.rssi !== null) {
        d.rssi = Math.round(clamp(jitter(d.rssi, 4), -95, -30));
        d.signalStrength = Math.round(clamp(((d.rssi + 95) / 65) * 100, 0, 100));
      }
    }
  }, 1000);

  setInterval(() => {
    if (media.isPlaying) {
      media = { ...media, positionMs: media.positionMs + 1000 };
      if (media.positionMs >= media.durationMs) nextTrack();
      else emit('media', media);
    }
  }, 1000);

  setInterval(() => {
    for (const d of devices) {
      if (d.status !== 'connected' || d.battery.combined === null) continue;
      if (!d.battery.charging) {
        const drain = Math.random() > 0.6 ? 1 : 0;
        d.battery.combined = clamp(d.battery.combined - drain, 0, 100);
        if (d.battery.left !== null) d.battery.left = clamp(d.battery.left - drain, 0, 100);
        if (d.battery.right !== null) d.battery.right = clamp(d.battery.right - drain, 0, 100);
      }
      const sample: BatterySample = { timestamp: Date.now(), deviceId: d.id, level: d.battery.combined };
      batteryHistory.push(sample);
      emit('battery-sample', sample);
      if (d.battery.combined <= 20 && !lowBatteryNotified.has(d.id)) {
        lowBatteryNotified.add(d.id);
        emit('battery-low', { device: d, level: d.battery.combined });
      }
    }
    emit('devices', devices);
  }, 30_000);

  return {
    system: {
      info: async () => ({ platform: 'browser', isWindows: false, simulated: true, appVersion: '1.0.0' }),
      setAutoLaunch: async () => undefined,
    },
    window: {
      minimize: async () => undefined,
      maximize: async () => undefined,
      close: async () => undefined,
      closeWidget: async () => undefined,
    },
    devices: {
      list: async () => devices,
      setVolume: async (id, v) => {
        const d = devices.find((x) => x.id === id);
        if (d) {
          d.volume = clamp(Math.round(v), 0, 100);
          emit('devices', devices);
        }
      },
      setMute: async (id, m) => {
        const d = devices.find((x) => x.id === id);
        if (d) {
          d.muted = m;
          emit('devices', devices);
        }
      },
      setDefault: async (id, comm = false) => {
        for (const d of devices) {
          if (comm) d.isDefaultComm = d.id === id;
          else d.isDefault = d.id === id;
        }
        emit('devices', devices);
      },
      rename: async (id, name) => {
        const d = devices.find((x) => x.id === id);
        if (d) {
          d.customName = name && name.trim().length > 0 ? name.trim() : null;
          emit('devices', devices);
        }
      },
      connect: async (id) => {
        const d = devices.find((x) => x.id === id);
        if (!d) return;
        d.status = 'reconnecting';
        emit('devices', devices);
        setTimeout(() => {
          d.status = 'connected';
          d.codec = (d.connection === 'bluetooth' ? (d.name.includes('Sony') ? 'LDAC' : 'AAC') : 'PCM') as CodecName;
          d.latencyMs = d.connection === 'bluetooth' ? Math.round(jitter(80, 40)) : 5;
          d.rssi = d.connection === 'bluetooth' ? Math.round(jitter(-55, 10)) : null;
          d.signalStrength = d.rssi !== null ? Math.round(clamp(((d.rssi + 95) / 65) * 100, 0, 100)) : null;
          emit('devices', devices);
          emit('device-connected', d);
        }, 1600);
      },
      disconnect: async (id) => {
        const d = devices.find((x) => x.id === id);
        if (!d) return;
        d.status = 'disconnected';
        d.codec = null;
        d.latencyMs = null;
        d.rssi = null;
        d.signalStrength = null;
        if (d.isDefault) {
          const fb = devices.find((x) => x.status === 'connected' && x.kind !== 'microphone');
          if (fb) fb.isDefault = true;
          d.isDefault = false;
        }
        emit('devices', devices);
        emit('device-disconnected', d);
      },
      forget: async (id) => {
        const idx = devices.findIndex((x) => x.id === id);
        if (idx >= 0) devices.splice(idx, 1);
        emit('devices', devices);
      },
      diagnostics: async (id): Promise<DiagnosticsReport> => {
        await new Promise((r) => setTimeout(r, 2500));
        const d = devices.find((x) => x.id === id);
        const issues: string[] = [];
        const latency = d?.latencyMs ?? Math.round(jitter(60, 20));
        const loss = Math.round(Math.max(0, jitter(0.3, 0.5)) * 100) / 100;
        if (latency > 150) issues.push('Yüksek gecikme tespit edildi');
        if (loss > 1) issues.push('Paket kaybı normalin üzerinde');
        return {
          deviceId: id,
          latencyMs: latency,
          jitterMs: Math.round(jitter(4, 3) * 10) / 10,
          packetLoss: loss,
          driverOk: true,
          firmwareUpToDate: d?.firmwareVersion !== '1.0.0',
          issues,
        };
      },
      onUpdated: (cb) => on('devices', cb),
      onConnected: (cb) => on('device-connected', cb),
      onDisconnected: (cb) => on('device-disconnected', cb),
      onBatteryLow: (cb) => on('battery-low', cb),
    },
    bluetooth: {
      scan: async () => {
        let i = 0;
        const found = [...SIM_SCAN_POOL].sort(() => Math.random() - 0.5);
        const timer = setInterval(() => {
          if (i >= found.length) {
            clearInterval(timer);
            emit('scan-finished', null);
            return;
          }
          emit('scan-result', { ...found[i], rssi: Math.round(jitter(found[i].rssi, 6)) });
          i += 1;
        }, 900);
      },
      pair: async (r) => {
        const id = `bt-${r.address.replace(/:/g, '').toLowerCase()}`;
        if (devices.some((d) => d.id === id)) return;
        const dev: AudioDevice = {
          id,
          name: r.name,
          customName: null,
          kind: r.kind,
          connection: 'bluetooth',
          status: 'pairing',
          isDefault: false,
          isDefaultComm: false,
          battery: { left: null, right: null, case: null, combined: 90, charging: false },
          signalStrength: Math.round(clamp(((r.rssi + 95) / 65) * 100, 0, 100)),
          rssi: r.rssi,
          bluetoothVersion: '5.3',
          codec: null,
          latencyMs: null,
          sampleRate: 48000,
          bitDepth: 16,
          volume: 50,
          muted: false,
          imageKey: r.kind,
          firmwareVersion: '1.0.0',
          driverVersion: null,
        };
        devices.push(dev);
        emit('devices', devices);
        setTimeout(() => {
          dev.status = 'connected';
          dev.codec = 'AAC';
          dev.latencyMs = Math.round(jitter(75, 30));
          emit('devices', devices);
          emit('device-connected', dev);
        }, 2200);
      },
      onScanResult: (cb) => on('scan-result', cb),
      onScanFinished: (cb) => on('scan-finished', cb),
    },
    sessions: {
      list: async () => sessions,
      setVolume: async (id, v) => {
        const s = sessions.find((x) => x.id === id);
        if (s) {
          s.volume = clamp(Math.round(v), 0, 100);
          emit('sessions', sessions);
        }
      },
      setMute: async (id, m) => {
        const s = sessions.find((x) => x.id === id);
        if (s) {
          s.muted = m;
          emit('sessions', sessions);
        }
      },
      setOutput: async (id, deviceId) => {
        const s = sessions.find((x) => x.id === id);
        if (s) {
          s.outputDeviceId = deviceId;
          emit('sessions', sessions);
        }
      },
      onUpdated: (cb) => on('sessions', cb),
    },
    mic: {
      get: async () => mic,
      update: async (partial) => {
        mic = { ...mic, ...partial };
        emit('mic', mic);
      },
      onUpdated: (cb) => on('mic', cb),
    },
    media: {
      get: async () => media,
      control: async (action) => {
        switch (action) {
          case 'play':
            media = { ...media, isPlaying: true };
            break;
          case 'pause':
            media = { ...media, isPlaying: false };
            break;
          case 'next':
            nextTrack();
            return;
          case 'previous':
            if (media.positionMs > 5000) media = { ...media, positionMs: 0 };
            else {
              trackIndex = (trackIndex - 1 + SIM_TRACKS.length) % SIM_TRACKS.length;
              const t = SIM_TRACKS[trackIndex];
              media = { ...media, title: t.title, artist: t.artist, album: t.album, positionMs: 0, durationMs: t.durationMs };
            }
            break;
        }
        emit('media', media);
      },
      onUpdated: (cb) => on('media', cb),
    },
    battery: {
      history: async (deviceId, sinceMs) => {
        const cutoff = Date.now() - sinceMs;
        return batteryHistory.filter((s) => s.deviceId === deviceId && s.timestamp >= cutoff);
      },
      onSample: (cb) => on('battery-sample', cb),
    },
    audio: {
      restartService: async () => {
        await new Promise((r) => setTimeout(r, 1800));
        return true;
      },
    },
    widgets: {
      toggle: async () => false,
    },
  };
}
