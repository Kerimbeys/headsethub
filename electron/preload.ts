import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
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
} from './shared-types';

type Listener<T> = (payload: T) => void;

function on<T>(channel: string, cb: Listener<T>): () => void {
  const handler = (_e: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const api = {
  system: {
    info: (): Promise<SystemInfo> => ipcRenderer.invoke('system:info'),
    setAutoLaunch: (enabled: boolean): Promise<void> => ipcRenderer.invoke('app:setAutoLaunch', enabled),
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
    closeWidget: (): Promise<void> => ipcRenderer.invoke('widget:close'),
  },
  devices: {
    list: (): Promise<AudioDevice[]> => ipcRenderer.invoke('devices:list'),
    setVolume: (id: string, v: number): Promise<void> => ipcRenderer.invoke('devices:setVolume', id, v),
    setMute: (id: string, m: boolean): Promise<void> => ipcRenderer.invoke('devices:setMute', id, m),
    setDefault: (id: string, comm = false): Promise<void> => ipcRenderer.invoke('devices:setDefault', id, comm),
    rename: (id: string, name: string | null): Promise<void> => ipcRenderer.invoke('devices:rename', id, name),
    connect: (id: string): Promise<void> => ipcRenderer.invoke('devices:connect', id),
    disconnect: (id: string): Promise<void> => ipcRenderer.invoke('devices:disconnect', id),
    forget: (id: string): Promise<void> => ipcRenderer.invoke('devices:forget', id),
    diagnostics: (id: string): Promise<DiagnosticsReport> => ipcRenderer.invoke('devices:diagnostics', id),
    onUpdated: (cb: Listener<AudioDevice[]>) => on('event:devices-updated', cb),
    onConnected: (cb: Listener<AudioDevice>) => on('event:device-connected', cb),
    onDisconnected: (cb: Listener<AudioDevice>) => on('event:device-disconnected', cb),
    onBatteryLow: (cb: Listener<{ device: AudioDevice; level: number }>) => on('event:battery-low', cb),
  },
  bluetooth: {
    scan: (): Promise<void> => ipcRenderer.invoke('bt:scan'),
    pair: (r: BluetoothScanResult): Promise<void> => ipcRenderer.invoke('bt:pair', r),
    onScanResult: (cb: Listener<BluetoothScanResult>) => on('event:scan-result', cb),
    onScanFinished: (cb: Listener<null>) => on('event:scan-finished', cb),
  },
  sessions: {
    list: (): Promise<AppAudioSession[]> => ipcRenderer.invoke('sessions:list'),
    setVolume: (id: string, v: number): Promise<void> => ipcRenderer.invoke('sessions:setVolume', id, v),
    setMute: (id: string, m: boolean): Promise<void> => ipcRenderer.invoke('sessions:setMute', id, m),
    setOutput: (id: string, deviceId: string): Promise<void> => ipcRenderer.invoke('sessions:setOutput', id, deviceId),
    onUpdated: (cb: Listener<AppAudioSession[]>) => on('event:sessions-updated', cb),
  },
  mic: {
    get: (): Promise<MicState> => ipcRenderer.invoke('mic:get'),
    update: (partial: Partial<MicState>): Promise<void> => ipcRenderer.invoke('mic:update', partial),
    onUpdated: (cb: Listener<MicState>) => on('event:mic-updated', cb),
  },
  media: {
    get: (): Promise<MediaSessionInfo> => ipcRenderer.invoke('media:get'),
    control: (action: 'play' | 'pause' | 'next' | 'previous'): Promise<void> =>
      ipcRenderer.invoke('media:control', action),
    onUpdated: (cb: Listener<MediaSessionInfo>) => on('event:media-updated', cb),
  },
  battery: {
    history: (deviceId: string, sinceMs: number): Promise<BatterySample[]> =>
      ipcRenderer.invoke('battery:history', deviceId, sinceMs),
    onSample: (cb: Listener<BatterySample>) => on('event:battery-sample', cb),
  },
  audio: {
    restartService: (): Promise<boolean> => ipcRenderer.invoke('audio:restartService'),
  },
  widgets: {
    toggle: (size: WidgetSize): Promise<boolean> => ipcRenderer.invoke('widgets:toggle', size),
  },
};

export type HeadsetHubApi = typeof api;

contextBridge.exposeInMainWorld('headsetHub', api);
