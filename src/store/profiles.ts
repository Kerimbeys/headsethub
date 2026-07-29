import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfileKind, SmartProfile } from '@/types/audio';

const DEFAULT_PROFILES: SmartProfile[] = [
  {
    id: 'gaming',
    name: 'Gaming',
    outputDeviceId: 'bt-sony-wh1000xm5',
    micDeviceId: 'usb-hyperx-quadcast',
    eqPresetId: 'rock',
    volume: 80,
    noiseSuppression: true,
    active: false,
  },
  {
    id: 'music',
    name: 'Music',
    outputDeviceId: 'bt-jbl-wave-buds-2',
    micDeviceId: null,
    eqPresetId: 'bass-boost',
    volume: 65,
    noiseSuppression: false,
    active: true,
  },
  {
    id: 'movie',
    name: 'Movie',
    outputDeviceId: 'jack-edifier-r1280t',
    micDeviceId: null,
    eqPresetId: 'flat',
    volume: 70,
    noiseSuppression: false,
    active: false,
  },
  {
    id: 'meeting',
    name: 'Meeting',
    outputDeviceId: 'bt-jbl-wave-buds-2',
    micDeviceId: 'usb-hyperx-quadcast',
    eqPresetId: 'vocal',
    volume: 55,
    noiseSuppression: true,
    active: false,
  },
  {
    id: 'streaming',
    name: 'Streaming',
    outputDeviceId: 'bt-sony-wh1000xm5',
    micDeviceId: 'usb-hyperx-quadcast',
    eqPresetId: 'podcast',
    volume: 75,
    noiseSuppression: true,
    active: false,
  },
];

interface ProfilesState {
  profiles: SmartProfile[];
  activateProfile: (id: ProfileKind) => SmartProfile | undefined;
  updateProfile: (id: ProfileKind, partial: Partial<SmartProfile>) => void;
}

export const useProfiles = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: DEFAULT_PROFILES,
      activateProfile: (id) => {
        set((s) => ({
          profiles: s.profiles.map((p) => ({ ...p, active: p.id === id })),
        }));
        return get().profiles.find((p) => p.id === id);
      },
      updateProfile: (id, partial) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...partial } : p)),
        })),
    }),
    { name: 'headsethub-profiles' },
  ),
);
