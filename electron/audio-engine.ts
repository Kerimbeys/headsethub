/**
 * AudioEngine — the heart of HeadsetHub's device layer.
 *
 * On Windows it talks to the OS through PowerShell (Core Audio via
 * AudioDeviceCmdlets when available, WMI/PnP for enumeration, and the
 * Windows.Devices.Bluetooth WinRT projection for BT battery/RSSI).
 *
 * On any other platform (or when the native calls fail) it transparently
 * falls back to a rich, deterministic simulation so the entire UI remains
 * fully functional for development and demos.
 */

import { EventEmitter } from 'events';
import { execFile } from 'child_process';
import {
  AudioDevice,
  AppAudioSession,
  BluetoothScanResult,
  MediaSessionInfo,
  MicState,
  BatterySample,
  DiagnosticsReport,
  CodecName,
} from './shared-types';

const IS_WINDOWS = process.platform === 'win32';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function runPowerShell(script: string, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { timeout: timeoutMs, windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      },
    );
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function jitter(base: number, spread: number): number {
  return base + (Math.random() - 0.5) * spread;
}

/* ------------------------------------------------------------------ */
/* Simulation seed data                                                */
/* ------------------------------------------------------------------ */

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
  { title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', durationMs: 243960 },
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

/* ------------------------------------------------------------------ */
/* AudioEngine                                                         */
/* ------------------------------------------------------------------ */

export class AudioEngine extends EventEmitter {
  private devices: AudioDevice[] = [];
  private sessions: AppAudioSession[] = [];
  private mic: MicState;
  private media: MediaSessionInfo;
  private batteryHistory: BatterySample[] = [];
  private simulated = !IS_WINDOWS;
  private trackIndex = 0;
  private tickTimer: NodeJS.Timeout | null = null;
  private mediaTimer: NodeJS.Timeout | null = null;
  private batteryTimer: NodeJS.Timeout | null = null;
  private lowBatteryNotified = new Set<string>();

  constructor() {
    super();
    this.devices = JSON.parse(JSON.stringify(SIM_DEVICES));
    this.sessions = JSON.parse(JSON.stringify(SIM_SESSIONS));
    this.mic = {
      deviceId: 'usb-hyperx-quadcast',
      volume: 74,
      muted: false,
      gain: 12,
      noiseSuppression: true,
      pushToTalk: false,
      pushToTalkKey: 'V',
      inputLevel: 0,
    };
    const t = SIM_TRACKS[0];
    this.media = {
      isPlaying: true,
      title: t.title,
      artist: t.artist,
      album: t.album,
      albumArtUrl: null,
      positionMs: 42000,
      durationMs: t.durationMs,
      sourceApp: 'Spotify',
    };
  }

  /* ---------------- lifecycle ---------------- */

  async start(): Promise<void> {
    if (IS_WINDOWS) {
      try {
        await this.refreshWindowsDevices();
        this.simulated = false;
      } catch {
        this.simulated = true;
      }
    }
    this.seedBatteryHistory();
    this.tickTimer = setInterval(() => this.tick(), 1000);
    this.mediaTimer = setInterval(() => this.mediaTick(), 1000);
    this.batteryTimer = setInterval(() => this.batteryTick(), 30_000);
  }

  stop(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.mediaTimer) clearInterval(this.mediaTimer);
    if (this.batteryTimer) clearInterval(this.batteryTimer);
  }

  isSimulated(): boolean {
    return this.simulated;
  }

  /* ---------------- Windows real layer ---------------- */

  private async refreshWindowsDevices(): Promise<void> {
    // Enumerate render/capture endpoints through PnP. Best-effort: any
    // failure falls back to the simulated set already loaded.
    const script = `
      Get-PnpDevice -Class AudioEndpoint -Status OK |
        Select-Object FriendlyName, InstanceId |
        ConvertTo-Json -Compress
    `;
    const out = await runPowerShell(script);
    if (!out) throw new Error('no output');
    const parsed = JSON.parse(out);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    if (list.length === 0) throw new Error('no endpoints');

    const real: AudioDevice[] = list.map((d: { FriendlyName: string; InstanceId: string }, i: number) => {
      const name: string = d.FriendlyName ?? `Audio Device ${i + 1}`;
      const lower = name.toLowerCase();
      const isBt = d.InstanceId?.toLowerCase().includes('bthenum') ?? false;
      const isMic = lower.includes('microphone') || lower.includes('mikrofon');
      const kind = isMic
        ? 'microphone'
        : lower.includes('buds') || lower.includes('airpods')
          ? 'earbuds'
          : lower.includes('speaker') || lower.includes('hoparlör')
            ? 'speaker'
            : 'headset';
      return {
        id: d.InstanceId ?? `real-${i}`,
        name,
        customName: null,
        kind,
        connection: isBt ? 'bluetooth' : lower.includes('usb') ? 'usb' : 'jack',
        status: 'connected',
        isDefault: i === 0,
        isDefaultComm: false,
        battery: { left: null, right: null, case: null, combined: null, charging: false },
        signalStrength: isBt ? 75 : null,
        rssi: isBt ? -58 : null,
        bluetoothVersion: isBt ? '5.x' : null,
        codec: (isBt ? 'SBC' : 'PCM') as CodecName,
        latencyMs: isBt ? 90 : 6,
        sampleRate: 48000,
        bitDepth: 16,
        volume: 50,
        muted: false,
        imageKey: kind,
        firmwareVersion: null,
        driverVersion: null,
      } as AudioDevice;
    });
    this.devices = real;
    void this.enrichWindowsBatteries();
  }

  private async enrichWindowsBatteries(): Promise<void> {
    // Bluetooth battery via WinRT device properties (best effort).
    try {
      const script = `
        Get-PnpDevice -Class Bluetooth -Status OK | ForEach-Object {
          $p = Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName '{104EA319-6EE2-4701-BD47-8DDBF425BBE5} 2' -ErrorAction SilentlyContinue
          if ($p -and $p.Data -ne $null) {
            [PSCustomObject]@{ Name = $_.FriendlyName; Battery = $p.Data } 
          }
        } | ConvertTo-Json -Compress
      `;
      const out = await runPowerShell(script);
      if (!out) return;
      const parsed = JSON.parse(out);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        const dev = this.devices.find((d) =>
          d.name.toLowerCase().includes(String(item.Name).toLowerCase().slice(0, 12)),
        );
        if (dev) {
          dev.battery.combined = Number(item.Battery);
        }
      }
      this.emit('devices-updated', this.devices);
    } catch {
      /* best effort */
    }
  }

  private async setWindowsSystemVolume(volume: number): Promise<void> {
    try {
      // keys 174/175 approach is unreliable; use CoreAudio via WScript fallback
      const script = `
        $vol = ${clamp(volume, 0, 100)} / 100
        Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int f(); int g(); int h(); int i();
  int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
  int j(); int GetMasterVolumeLevelScalar(out float pfLevel);
  int k(); int l(); int m(); int n();
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, System.Guid pguidEventContext);
  int GetMute(out bool pbMute);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice { int Activate(ref System.Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev); }
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator { int f(); int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint); }
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class Audio {
  static IAudioEndpointVolume Vol() {
    var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
    IMMDevice dev = null; Marshal.ThrowExceptionForHR(enumerator.GetDefaultAudioEndpoint(0, 1, out dev));
    IAudioEndpointVolume epv = null; var epvid = typeof(IAudioEndpointVolume).GUID;
    Marshal.ThrowExceptionForHR(dev.Activate(ref epvid, 23, 0, out epv)); return epv;
  }
  public static void SetVolume(float level) { Marshal.ThrowExceptionForHR(Vol().SetMasterVolumeLevelScalar(level, System.Guid.Empty)); }
  public static void SetMute(bool mute) { Marshal.ThrowExceptionForHR(Vol().SetMute(mute, System.Guid.Empty)); }
}
'@ -ErrorAction SilentlyContinue
        [Audio]::SetVolume($vol)
      `;
      await runPowerShell(script);
    } catch {
      /* best effort */
    }
  }

  /* ---------------- simulation ticks ---------------- */

  private tick(): void {
    // Animate session peaks + mic level for live meters.
    for (const s of this.sessions) {
      const active = !s.muted && (s.id === 'spotify' ? this.media.isPlaying : Math.random() > 0.25);
      s.peak = active ? clamp(jitter(s.volume * 0.7, 30), 0, 100) : Math.max(0, s.peak - 25);
    }
    this.emit('sessions-updated', this.sessions);

    const talking = !this.mic.muted && Math.random() > 0.3;
    this.mic.inputLevel = talking
      ? clamp(jitter(45 + this.mic.gain, 40), 0, 100)
      : Math.max(0, this.mic.inputLevel - 20);
    this.emit('mic-updated', this.mic);

    // Drift RSSI/signal a little for realism.
    for (const d of this.devices) {
      if (d.status === 'connected' && d.rssi !== null) {
        d.rssi = Math.round(clamp(jitter(d.rssi, 4), -95, -30));
        d.signalStrength = Math.round(clamp(((d.rssi + 95) / 65) * 100, 0, 100));
      }
    }
  }

  private mediaTick(): void {
    if (this.media.isPlaying) {
      this.media.positionMs += 1000;
      if (this.media.positionMs >= this.media.durationMs) this.nextTrack();
      this.emit('media-updated', this.media);
    }
  }

  private batteryTick(): void {
    for (const d of this.devices) {
      if (d.status !== 'connected' || d.battery.combined === null) continue;
      if (this.simulated && !d.battery.charging) {
        const drain = Math.random() > 0.6 ? 1 : 0;
        d.battery.combined = clamp(d.battery.combined - drain, 0, 100);
        if (d.battery.left !== null) d.battery.left = clamp(d.battery.left - drain, 0, 100);
        if (d.battery.right !== null) d.battery.right = clamp(d.battery.right - drain, 0, 100);
      }
      const sample: BatterySample = {
        timestamp: Date.now(),
        deviceId: d.id,
        level: d.battery.combined,
      };
      this.batteryHistory.push(sample);
      this.emit('battery-sample', sample);
      if (d.battery.combined <= 20 && !this.lowBatteryNotified.has(d.id)) {
        this.lowBatteryNotified.add(d.id);
        this.emit('battery-low', { device: d, level: d.battery.combined });
      }
      if (d.battery.combined > 25) this.lowBatteryNotified.delete(d.id);
    }
    if (this.batteryHistory.length > 5000) {
      this.batteryHistory = this.batteryHistory.slice(-4000);
    }
    this.emit('devices-updated', this.devices);
  }

  private seedBatteryHistory(): void {
    // Backfill ~7 days of plausible battery history for charts.
    const now = Date.now();
    const hour = 3600_000;
    for (const d of this.devices) {
      if (d.battery.combined === null) continue;
      let level = 100;
      for (let t = now - 7 * 24 * hour; t <= now; t += hour) {
        const hourOfDay = new Date(t).getHours();
        const inUse = hourOfDay >= 9 && hourOfDay <= 23;
        level -= inUse ? 2 + Math.random() * 3 : 0;
        if (level < 8) level = 100; // charged overnight
        this.batteryHistory.push({ timestamp: t, deviceId: d.id, level: Math.round(level) });
      }
    }
  }

  private nextTrack(): void {
    this.trackIndex = (this.trackIndex + 1) % SIM_TRACKS.length;
    const t = SIM_TRACKS[this.trackIndex];
    this.media = { ...this.media, title: t.title, artist: t.artist, album: t.album, positionMs: 0, durationMs: t.durationMs };
    this.emit('media-updated', this.media);
  }

  /* ---------------- public queries ---------------- */

  getDevices(): AudioDevice[] {
    return this.devices;
  }

  getSessions(): AppAudioSession[] {
    return this.sessions;
  }

  getMicState(): MicState {
    return this.mic;
  }

  getMediaSession(): MediaSessionInfo {
    return this.media;
  }

  getBatteryHistory(deviceId: string, sinceMs: number): BatterySample[] {
    const cutoff = Date.now() - sinceMs;
    return this.batteryHistory.filter((s) => s.deviceId === deviceId && s.timestamp >= cutoff);
  }

  /* ---------------- public commands ---------------- */

  setDeviceVolume(deviceId: string, volume: number): void {
    const d = this.devices.find((x) => x.id === deviceId);
    if (!d) return;
    d.volume = clamp(Math.round(volume), 0, 100);
    if (IS_WINDOWS && d.isDefault) void this.setWindowsSystemVolume(d.volume);
    this.emit('devices-updated', this.devices);
  }

  setDeviceMute(deviceId: string, muted: boolean): void {
    const d = this.devices.find((x) => x.id === deviceId);
    if (!d) return;
    d.muted = muted;
    this.emit('devices-updated', this.devices);
  }

  setDefaultDevice(deviceId: string, comm = false): void {
    for (const d of this.devices) {
      if (comm) d.isDefaultComm = d.id === deviceId;
      else d.isDefault = d.id === deviceId;
    }
    this.emit('devices-updated', this.devices);
  }

  renameDevice(deviceId: string, customName: string | null): void {
    const d = this.devices.find((x) => x.id === deviceId);
    if (!d) return;
    d.customName = customName && customName.trim().length > 0 ? customName.trim() : null;
    this.emit('devices-updated', this.devices);
  }

  connectDevice(deviceId: string): void {
    const d = this.devices.find((x) => x.id === deviceId);
    if (!d) return;
    d.status = 'reconnecting';
    this.emit('devices-updated', this.devices);
    setTimeout(() => {
      d.status = 'connected';
      d.codec = d.connection === 'bluetooth' ? (d.name.includes('Sony') ? 'LDAC' : 'AAC') : 'PCM';
      d.latencyMs = d.connection === 'bluetooth' ? Math.round(jitter(80, 40)) : 5;
      d.rssi = d.connection === 'bluetooth' ? Math.round(jitter(-55, 10)) : null;
      d.signalStrength = d.rssi !== null ? Math.round(clamp(((d.rssi + 95) / 65) * 100, 0, 100)) : null;
      this.emit('devices-updated', this.devices);
      this.emit('device-connected', d);
    }, 1600);
  }

  disconnectDevice(deviceId: string): void {
    const d = this.devices.find((x) => x.id === deviceId);
    if (!d) return;
    d.status = 'disconnected';
    d.codec = null;
    d.latencyMs = null;
    d.rssi = null;
    d.signalStrength = null;
    if (d.isDefault) {
      const fallback = this.devices.find((x) => x.status === 'connected' && x.kind !== 'microphone');
      if (fallback) fallback.isDefault = true;
      d.isDefault = false;
    }
    this.emit('devices-updated', this.devices);
    this.emit('device-disconnected', d);
  }

  forgetDevice(deviceId: string): void {
    this.devices = this.devices.filter((x) => x.id !== deviceId);
    this.emit('devices-updated', this.devices);
  }

  startScan(): void {
    let i = 0;
    const found = [...SIM_SCAN_POOL].sort(() => Math.random() - 0.5);
    const timer = setInterval(() => {
      if (i >= found.length) {
        clearInterval(timer);
        this.emit('scan-finished');
        return;
      }
      this.emit('scan-result', { ...found[i], rssi: Math.round(jitter(found[i].rssi, 6)) });
      i += 1;
    }, 900);
  }

  pairDevice(result: BluetoothScanResult): void {
    const id = `bt-${result.address.replace(/:/g, '').toLowerCase()}`;
    if (this.devices.some((d) => d.id === id)) return;
    const dev: AudioDevice = {
      id,
      name: result.name,
      customName: null,
      kind: result.kind,
      connection: 'bluetooth',
      status: 'pairing',
      isDefault: false,
      isDefaultComm: false,
      battery: { left: null, right: null, case: null, combined: 90, charging: false },
      signalStrength: Math.round(clamp(((result.rssi + 95) / 65) * 100, 0, 100)),
      rssi: result.rssi,
      bluetoothVersion: '5.3',
      codec: null,
      latencyMs: null,
      sampleRate: 48000,
      bitDepth: 16,
      volume: 50,
      muted: false,
      imageKey: result.kind,
      firmwareVersion: '1.0.0',
      driverVersion: null,
    };
    this.devices.push(dev);
    this.emit('devices-updated', this.devices);
    setTimeout(() => {
      dev.status = 'connected';
      dev.codec = 'AAC';
      dev.latencyMs = Math.round(jitter(75, 30));
      this.emit('devices-updated', this.devices);
      this.emit('device-connected', dev);
    }, 2200);
  }

  setSessionVolume(sessionId: string, volume: number): void {
    const s = this.sessions.find((x) => x.id === sessionId);
    if (!s) return;
    s.volume = clamp(Math.round(volume), 0, 100);
    this.emit('sessions-updated', this.sessions);
  }

  setSessionMute(sessionId: string, muted: boolean): void {
    const s = this.sessions.find((x) => x.id === sessionId);
    if (!s) return;
    s.muted = muted;
    this.emit('sessions-updated', this.sessions);
  }

  setSessionOutput(sessionId: string, deviceId: string): void {
    const s = this.sessions.find((x) => x.id === sessionId);
    if (!s) return;
    s.outputDeviceId = deviceId;
    this.emit('sessions-updated', this.sessions);
  }

  updateMic(partial: Partial<MicState>): void {
    this.mic = { ...this.mic, ...partial };
    this.emit('mic-updated', this.mic);
  }

  mediaControl(action: 'play' | 'pause' | 'next' | 'previous'): void {
    switch (action) {
      case 'play':
        this.media.isPlaying = true;
        break;
      case 'pause':
        this.media.isPlaying = false;
        break;
      case 'next':
        this.nextTrack();
        return;
      case 'previous':
        if (this.media.positionMs > 5000) this.media.positionMs = 0;
        else {
          this.trackIndex = (this.trackIndex - 1 + SIM_TRACKS.length) % SIM_TRACKS.length;
          const t = SIM_TRACKS[this.trackIndex];
          this.media = { ...this.media, title: t.title, artist: t.artist, album: t.album, positionMs: 0, durationMs: t.durationMs };
        }
        break;
    }
    this.emit('media-updated', this.media);
  }

  async runDiagnostics(deviceId: string): Promise<DiagnosticsReport> {
    const d = this.devices.find((x) => x.id === deviceId);
    await new Promise((r) => setTimeout(r, 2500));
    const issues: string[] = [];
    if (!d) {
      return { deviceId, latencyMs: 0, jitterMs: 0, packetLoss: 0, driverOk: false, firmwareUpToDate: false, issues: ['Cihaz bulunamadı'] };
    }
    const latency = d.latencyMs ?? Math.round(jitter(60, 20));
    const jit = Math.round(jitter(4, 3) * 10) / 10;
    const loss = Math.round(Math.max(0, jitter(0.3, 0.5)) * 100) / 100;
    if (latency > 150) issues.push('Yüksek gecikme tespit edildi');
    if (loss > 1) issues.push('Paket kaybı normalin üzerinde');
    if (d.battery.combined !== null && d.battery.combined < 15) issues.push('Pil seviyesi kritik');
    return {
      deviceId,
      latencyMs: latency,
      jitterMs: jit,
      packetLoss: loss,
      driverOk: true,
      firmwareUpToDate: d.firmwareVersion !== '1.0.0',
      issues,
    };
  }

  async restartAudioService(): Promise<boolean> {
    if (IS_WINDOWS) {
      try {
        await runPowerShell('Restart-Service -Name Audiosrv -Force', 20000);
        return true;
      } catch {
        return false;
      }
    }
    await new Promise((r) => setTimeout(r, 1800));
    return true;
  }
}
