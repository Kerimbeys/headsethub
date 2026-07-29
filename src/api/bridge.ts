/**
 * Renderer-side access to the HeadsetHub API.
 *
 * When running inside Electron the preload bridge (`window.headsetHub`)
 * is used. When running in a plain browser (e.g. `pnpm dev` opened in a
 * normal tab) a full in-renderer simulation with identical behaviour is
 * provided, so the UI is always testable.
 */

import type {
  AudioDevice,
  AppAudioSession,
  BluetoothScanResult,
  MediaSessionInfo,
  MicState,
  BatterySample,
  DiagnosticsReport,
  SystemInfo,
  WidgetSize,
} from '@/types/audio';
import { createBrowserSimulation } from './browser-sim';

type Listener<T> = (payload: T) => void;
type Unsubscribe = () => void;

export interface HeadsetHubBridge {
  system: {
    info: () => Promise<SystemInfo>;
    setAutoLaunch: (enabled: boolean) => Promise<void>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    closeWidget: () => Promise<void>;
  };
  devices: {
    list: () => Promise<AudioDevice[]>;
    setVolume: (id: string, v: number) => Promise<void>;
    setMute: (id: string, m: boolean) => Promise<void>;
    setDefault: (id: string, comm?: boolean) => Promise<void>;
    rename: (id: string, name: string | null) => Promise<void>;
    connect: (id: string) => Promise<void>;
    disconnect: (id: string) => Promise<void>;
    forget: (id: string) => Promise<void>;
    diagnostics: (id: string) => Promise<DiagnosticsReport>;
    onUpdated: (cb: Listener<AudioDevice[]>) => Unsubscribe;
    onConnected: (cb: Listener<AudioDevice>) => Unsubscribe;
    onDisconnected: (cb: Listener<AudioDevice>) => Unsubscribe;
    onBatteryLow: (cb: Listener<{ device: AudioDevice; level: number }>) => Unsubscribe;
  };
  bluetooth: {
    scan: () => Promise<void>;
    pair: (r: BluetoothScanResult) => Promise<void>;
    onScanResult: (cb: Listener<BluetoothScanResult>) => Unsubscribe;
    onScanFinished: (cb: Listener<null>) => Unsubscribe;
  };
  sessions: {
    list: () => Promise<AppAudioSession[]>;
    setVolume: (id: string, v: number) => Promise<void>;
    setMute: (id: string, m: boolean) => Promise<void>;
    setOutput: (id: string, deviceId: string) => Promise<void>;
    onUpdated: (cb: Listener<AppAudioSession[]>) => Unsubscribe;
  };
  mic: {
    get: () => Promise<MicState>;
    update: (partial: Partial<MicState>) => Promise<void>;
    onUpdated: (cb: Listener<MicState>) => Unsubscribe;
  };
  media: {
    get: () => Promise<MediaSessionInfo>;
    control: (action: 'play' | 'pause' | 'next' | 'previous') => Promise<void>;
    onUpdated: (cb: Listener<MediaSessionInfo>) => Unsubscribe;
  };
  battery: {
    history: (deviceId: string, sinceMs: number) => Promise<BatterySample[]>;
    onSample: (cb: Listener<BatterySample>) => Unsubscribe;
  };
  audio: {
    restartService: () => Promise<boolean>;
  };
  widgets: {
    toggle: (size: WidgetSize) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    headsetHub?: HeadsetHubBridge;
  }
}

export const bridge: HeadsetHubBridge = window.headsetHub ?? createBrowserSimulation();

export const isElectron = !!window.headsetHub;
