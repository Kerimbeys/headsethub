import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bridge } from '@/api/bridge';
import type {
  AudioDevice,
  AppAudioSession,
  MediaSessionInfo,
  MicState,
  BatterySample,
  SystemInfo,
} from '@/types/audio';

/** Live device list, kept in sync via main-process events. */
export function useDevices(): AudioDevice[] {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['devices'],
    queryFn: () => bridge.devices.list(),
    staleTime: Infinity,
  });
  useEffect(() => {
    return bridge.devices.onUpdated((devices) => {
      qc.setQueryData(['devices'], [...devices]);
    });
  }, [qc]);
  return data ?? [];
}

export function useDefaultDevice(): AudioDevice | undefined {
  const devices = useDevices();
  return devices.find((d) => d.isDefault) ?? devices.find((d) => d.status === 'connected');
}

export function useSessions(): AppAudioSession[] {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => bridge.sessions.list(),
    staleTime: Infinity,
  });
  useEffect(() => {
    return bridge.sessions.onUpdated((sessions) => {
      qc.setQueryData(['sessions'], [...sessions]);
    });
  }, [qc]);
  return data ?? [];
}

export function useMicState(): MicState | undefined {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['mic'],
    queryFn: () => bridge.mic.get(),
    staleTime: Infinity,
  });
  useEffect(() => {
    return bridge.mic.onUpdated((mic) => {
      qc.setQueryData(['mic'], { ...mic });
    });
  }, [qc]);
  return data;
}

export function useMediaSession(): MediaSessionInfo | undefined {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['media'],
    queryFn: () => bridge.media.get(),
    staleTime: Infinity,
  });
  useEffect(() => {
    return bridge.media.onUpdated((media) => {
      qc.setQueryData(['media'], { ...media });
    });
  }, [qc]);
  return data;
}

export function useBatteryHistory(deviceId: string | undefined, sinceMs: number): BatterySample[] {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['battery-history', deviceId, sinceMs],
    queryFn: () => (deviceId ? bridge.battery.history(deviceId, sinceMs) : Promise.resolve([])),
    enabled: !!deviceId,
    staleTime: 60_000,
  });
  useEffect(() => {
    return bridge.battery.onSample((sample) => {
      if (sample.deviceId !== deviceId) return;
      qc.setQueryData(['battery-history', deviceId, sinceMs], (old: BatterySample[] | undefined) =>
        old ? [...old, sample] : [sample],
      );
    });
  }, [qc, deviceId, sinceMs]);
  return data ?? [];
}

export function useSystemInfo(): SystemInfo | undefined {
  const { data } = useQuery({
    queryKey: ['system-info'],
    queryFn: () => bridge.system.info(),
    staleTime: Infinity,
  });
  return data;
}
