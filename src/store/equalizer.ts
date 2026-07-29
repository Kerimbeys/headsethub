import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EqBand, EqPreset } from '@/types/audio';

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

function bands(gains: number[]): EqBand[] {
  return EQ_FREQUENCIES.map((frequency, i) => ({ frequency, gain: gains[i] ?? 0 }));
}

export const BUILTIN_PRESETS: EqPreset[] = [
  { id: 'flat', name: 'Flat', builtIn: true, bands: bands([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  { id: 'bass-boost', name: 'Bass Boost', builtIn: true, bands: bands([7, 6, 5, 3, 1, 0, 0, 0, 0, 0]) },
  { id: 'vocal', name: 'Vocal', builtIn: true, bands: bands([-2, -1, 0, 2, 4, 5, 4, 2, 0, -1]) },
  { id: 'rock', name: 'Rock', builtIn: true, bands: bands([5, 4, 2, 0, -1, 0, 2, 3, 4, 4]) },
  { id: 'electronic', name: 'Electronic', builtIn: true, bands: bands([6, 5, 2, 0, -2, 0, 1, 3, 5, 6]) },
  { id: 'podcast', name: 'Podcast', builtIn: true, bands: bands([-3, -2, 0, 3, 5, 5, 4, 2, -1, -3]) },
];

interface EqState {
  enabled: boolean;
  gains: number[]; // 10 values, -12..12
  activePresetId: string | null;
  customPresets: EqPreset[];
  cloudSync: boolean;
  lastSyncedAt: number | null;
  setEnabled: (v: boolean) => void;
  setGain: (index: number, gain: number) => void;
  applyPreset: (preset: EqPreset) => void;
  saveCustomPreset: (name: string) => void;
  deleteCustomPreset: (id: string) => void;
  reset: () => void;
  setCloudSync: (v: boolean) => void;
  markSynced: () => void;
}

export const useEqualizer = create<EqState>()(
  persist(
    (set, get) => ({
      enabled: true,
      gains: new Array(10).fill(0),
      activePresetId: 'flat',
      customPresets: [],
      cloudSync: false,
      lastSyncedAt: null,
      setEnabled: (enabled) => set({ enabled }),
      setGain: (index, gain) =>
        set((s) => {
          const gains = [...s.gains];
          gains[index] = Math.max(-12, Math.min(12, gain));
          return { gains, activePresetId: null };
        }),
      applyPreset: (preset) =>
        set({ gains: preset.bands.map((b) => b.gain), activePresetId: preset.id }),
      saveCustomPreset: (name) => {
        const { gains, customPresets } = get();
        const preset: EqPreset = {
          id: `custom-${Date.now()}`,
          name,
          builtIn: false,
          bands: bands([...gains]),
        };
        set({ customPresets: [...customPresets, preset], activePresetId: preset.id });
      },
      deleteCustomPreset: (id) =>
        set((s) => ({
          customPresets: s.customPresets.filter((p) => p.id !== id),
          activePresetId: s.activePresetId === id ? null : s.activePresetId,
        })),
      reset: () => set({ gains: new Array(10).fill(0), activePresetId: 'flat' }),
      setCloudSync: (cloudSync) => set({ cloudSync }),
      markSynced: () => set({ lastSyncedAt: Date.now() }),
    }),
    { name: 'headsethub-eq' },
  ),
);
