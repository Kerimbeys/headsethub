import { cn } from '@/utils';

interface AppIconProps {
  iconKey: string;
  size?: number;
  className?: string;
}

/**
 * Stylized brand-inspired glyphs for well-known apps, rendered as inline
 * SVG so no external assets or trademark bitmaps are required.
 */
export function AppIcon({ iconKey, size = 36, className }: AppIconProps) {
  const common = { width: size, height: size, viewBox: '0 0 36 36', className: cn('shrink-0', className) };

  switch (iconKey) {
    case 'spotify':
      return (
        <svg {...common}>
          <circle cx="18" cy="18" r="16" fill="#1DB954" />
          <path d="M10 14.5c5.5-1.6 11-1 15 1.3M11 19c4.5-1.2 9-0.7 12.4 1.2M12 23.2c3.6-0.9 7-0.5 9.8 1" stroke="#0a0a0f" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'discord':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="32" height="32" rx="10" fill="#5865F2" />
          <path d="M12 11c4-1.8 8-1.8 12 0 2.4 3.8 3.2 7.8 2.8 12-1.7 1.3-3.4 2.1-5.2 2.6l-1-2c-2.4 0.7-4.8 0.7-7.2 0l-1 2c-1.8-0.5-3.5-1.3-5.2-2.6-0.4-4.2 0.4-8.2 2.8-12z" fill="#fff" />
          <circle cx="14" cy="18.5" r="2" fill="#5865F2" />
          <circle cx="22" cy="18.5" r="2" fill="#5865F2" />
        </svg>
      );
    case 'chrome':
      return (
        <svg {...common}>
          <circle cx="18" cy="18" r="16" fill="#fff" />
          <circle cx="18" cy="18" r="6" fill="#4285F4" stroke="#fff" strokeWidth="1.5" />
          <path d="M18 12h13.8A16 16 0 0 0 4.5 9.5l6.9 12z" fill="#EA4335" />
          <path d="M22.8 21l-6.9 12A16 16 0 0 0 31.8 12H18z" fill="#FBBC05" transform="rotate(120 18 18)" />
          <path d="M13.2 21L6.3 9A16 16 0 0 0 15.9 33.9L22.8 21z" fill="#34A853" />
        </svg>
      );
    case 'obs':
      return (
        <svg {...common}>
          <circle cx="18" cy="18" r="16" fill="#1f2430" stroke="#8a94a8" strokeWidth="1.5" />
          <path d="M13 9.5a7 7 0 0 1 9.5 3 6 6 0 0 0-8-1.2A6.5 6.5 0 0 1 13 9.5zM8.8 20a7 7 0 0 1 1.4-9.8 6 6 0 0 0 2.6 7.7A6.5 6.5 0 0 1 8.8 20zM26.5 21.5a7 7 0 0 1-10.6 4.3 6 6 0 0 0 6.9-4.5 6.5 6.5 0 0 1 3.7 0.2z" fill="#fff" />
        </svg>
      );
    case 'cs2':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="32" height="32" rx="10" fill="#de9b35" />
          <path d="M10 26L22 8l4 2-10 18h-4l-2-2z" fill="#1a1a1a" />
          <circle cx="24" cy="24" r="4" fill="#1a1a1a" />
        </svg>
      );
    case 'steam':
      return (
        <svg {...common}>
          <circle cx="18" cy="18" r="16" fill="#171a21" />
          <circle cx="24" cy="12" r="5" fill="none" stroke="#c7d5e0" strokeWidth="2" />
          <circle cx="24" cy="12" r="2" fill="#c7d5e0" />
          <circle cx="12" cy="24" r="4" fill="none" stroke="#c7d5e0" strokeWidth="2" />
          <path d="M15 22l6-7" stroke="#c7d5e0" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="28" height="28" rx="9" fill="rgb(var(--surface-overlay))" stroke="rgb(var(--stroke) / 0.2)" />
          <path d="M14 12v12l10-6z" fill="rgb(var(--accent))" />
        </svg>
      );
  }
}
