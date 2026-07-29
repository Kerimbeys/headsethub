import { create } from 'zustand';

export type PageId =
  | 'dashboard'
  | 'devices'
  | 'bluetooth'
  | 'mixer'
  | 'microphone'
  | 'equalizer'
  | 'battery'
  | 'profiles'
  | 'tools'
  | 'settings';

export type ToastKind = 'success' | 'info' | 'warning' | 'error' | 'device';

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  battery?: number | null;
  duration: number;
}

interface UiState {
  page: PageId;
  toasts: Toast[];
  renameTargetId: string | null;
  setPage: (p: PageId) => void;
  pushToast: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => void;
  dismissToast: (id: string) => void;
  openRename: (deviceId: string) => void;
  closeRename: () => void;
}

let toastCounter = 0;

export const useUi = create<UiState>((set) => ({
  page: 'dashboard',
  toasts: [],
  renameTargetId: null,
  setPage: (page) => set({ page }),
  pushToast: (t) =>
    set((s) => ({
      toasts: [
        ...s.toasts.slice(-3),
        { ...t, id: `toast-${++toastCounter}`, duration: t.duration ?? 4200 },
      ],
    })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  openRename: (deviceId) => set({ renameTargetId: deviceId }),
  closeRename: () => set({ renameTargetId: null }),
}));
