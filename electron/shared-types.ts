/**
 * Shared type contracts between the Electron main process and the renderer.
 * These types describe every audio entity HeadsetHub manages.
 */

export type ConnectionType = 'bluetooth' | 'usb' | 'jack' | 'internal';
export type DeviceKind = 'headset' | 'earbuds' | 'speaker' | 'microphone' | 'soundbar';
export type CodecName = 'AAC' | 'SBC' | 'aptX' | 'aptX HD' | 'LDAC' | 'LC3' | 'PCM';
export type DeviceStatus = 'connected' | 'disconnected' | 'pairing' | 'reconnecting';

export interface BatteryInfo {
  left: number | null;
  right: number | null;
  case: number | null;
  combined: number | null;
  charging: boolean;
}

export interface AudioDevice {
  id: string;
  name: string;
  customName: string | null;
  kind: DeviceKind;
  connection: ConnectionType;
  status: DeviceStatus;
  isDefault: boolean;
  isDefaultComm: boolean;
  battery: BatteryInfo;
  signalStrength: number | null; // 0-100
  rssi: number | null; // dBm
  bluetoothVersion: string | null;
  codec: CodecName | null;
  latencyMs: number | null;
  sampleRate: number; // Hz
  bitDepth: number;
  volume: number; // 0-100
  muted: boolean;
  imageKey: string;
  firmwareVersion: string | null;
  driverVersion: string | null;
}

export interface AppAudioSession {
  id: string;
  appName: string;
  displayName: string;
  iconKey: string;
  volume: number;
  muted: boolean;
  peak: number;
  outputDeviceId: string;
}

export interface MicState {
  deviceId: string;
  volume: number;
  muted: boolean;
  gain: number;
  noiseSuppression: boolean;
  pushToTalk: boolean;
  pushToTalkKey: string;
  inputLevel: number;
}

export interface BluetoothScanResult {
  address: string;
  name: string;
  rssi: number;
  kind: DeviceKind;
  paired: boolean;
}

export interface MediaSessionInfo {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumArtUrl: string | null;
  positionMs: number;
  durationMs: number;
  sourceApp: string;
}

export interface BatterySample {
  timestamp: number;
  deviceId: string;
  level: number;
}

export interface EqBand {
  frequency: number;
  gain: number; // -12..12 dB
}

export interface EqPreset {
  id: string;
  name: string;
  bands: EqBand[];
  builtIn: boolean;
}

export type ProfileKind = 'gaming' | 'music' | 'movie' | 'meeting' | 'streaming';

export interface SmartProfile {
  id: ProfileKind;
  name: string;
  outputDeviceId: string | null;
  micDeviceId: string | null;
  eqPresetId: string | null;
  volume: number;
  noiseSuppression: boolean;
  active: boolean;
}

export interface DiagnosticsReport {
  deviceId: string;
  latencyMs: number;
  jitterMs: number;
  packetLoss: number;
  driverOk: boolean;
  firmwareUpToDate: boolean;
  issues: string[];
}

export interface SystemInfo {
  platform: string;
  isWindows: boolean;
  simulated: boolean;
  appVersion: string;
}

export type WidgetSize = 'small' | 'medium' | 'large';

export interface HeadsetHubEvents {
  'devices-updated': AudioDevice[];
  'sessions-updated': AppAudioSession[];
  'mic-updated': MicState;
  'media-updated': MediaSessionInfo;
  'battery-sample': BatterySample;
  'device-connected': AudioDevice;
  'device-disconnected': AudioDevice;
  'battery-low': { device: AudioDevice; level: number };
  'scan-result': BluetoothScanResult;
  'scan-finished': void;
}
