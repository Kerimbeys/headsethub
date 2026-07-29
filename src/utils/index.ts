import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AudioDevice } from '@/types/audio';

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Display name honoring the user's custom rename. */
export function deviceLabel(device: AudioDevice): string {
  return device.customName ?? device.name;
}

/** ms → m:ss */
export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** 48000 → "48 kHz" */
export function formatSampleRate(hz: number): string {
  return `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz`;
}

/** Battery color by level. */
export function batteryColor(level: number | null): string {
  if (level === null) return 'text-ink-faint';
  if (level <= 20) return 'text-red-400';
  if (level <= 45) return 'text-amber-400';
  return 'text-emerald-400';
}

export function batteryBarColor(level: number | null): string {
  if (level === null) return 'bg-white/20';
  if (level <= 20) return 'bg-red-400';
  if (level <= 45) return 'bg-amber-400';
  return 'bg-emerald-400';
}

/** RSSI (dBm) → signal quality tier 0..4 */
export function rssiTier(rssi: number | null): number {
  if (rssi === null) return 0;
  if (rssi >= -50) return 4;
  if (rssi >= -60) return 3;
  if (rssi >= -70) return 2;
  if (rssi >= -80) return 1;
  return 0;
}

/** Simple estimated remaining hours from recent battery samples. */
export function estimateRemainingHours(samples: { timestamp: number; level: number }[]): number | null {
  if (samples.length < 2) return null;
  const recent = samples.slice(-24);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const dtHours = (last.timestamp - first.timestamp) / 3600_000;
  const drop = first.level - last.level;
  if (dtHours <= 0 || drop <= 0) return null;
  const ratePerHour = drop / dtHours;
  return Math.round((last.level / ratePerHour) * 10) / 10;
}
