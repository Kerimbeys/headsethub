import { cn } from '@/utils';

interface DeviceImageProps {
  imageKey: string;
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Hand-crafted SVG device illustrations. Every device kind has its own
 * premium render with accent-tinted gradients — no external assets needed.
 */
export function DeviceImage({ imageKey, size = 96, className, glow = false }: DeviceImageProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 96 96',
    fill: 'none',
    className: cn(glow && 'drop-shadow-[0_0_24px_rgb(var(--accent)/0.45)]', className),
  };

  const accent = 'rgb(var(--accent))';
  const accentSoft = 'rgb(var(--accent) / 0.35)';
  const body = 'rgb(var(--surface-overlay))';
  const stroke = 'rgb(var(--stroke) / 0.25)';

  switch (imageKey) {
    case 'headset':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="hs-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accentSoft} />
              <stop offset="100%" stopColor={body} />
            </linearGradient>
          </defs>
          <path d="M20 56v-8c0-15.5 12.5-28 28-28s28 12.5 28 28v8" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <rect x="12" y="52" width="18" height="28" rx="9" fill="url(#hs-g)" stroke={stroke} />
          <rect x="66" y="52" width="18" height="28" rx="9" fill="url(#hs-g)" stroke={stroke} />
          <rect x="16" y="57" width="10" height="18" rx="5" fill={accent} opacity="0.6" />
          <rect x="70" y="57" width="10" height="18" rx="5" fill={accent} opacity="0.6" />
        </svg>
      );
    case 'earbuds':
    case 'earbuds-2':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="eb-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accentSoft} />
              <stop offset="100%" stopColor={body} />
            </linearGradient>
          </defs>
          <rect x="14" y="34" width="68" height="42" rx="16" fill="url(#eb-g)" stroke={stroke} />
          <path d="M14 50h68" stroke={stroke} strokeWidth="1.5" />
          <circle cx="36" cy="30" r="11" fill={body} stroke={accent} strokeWidth="2.5" />
          <rect x="32.5" y="36" width="7" height="16" rx="3.5" fill={body} stroke={accent} strokeWidth="2.5" />
          <circle cx="60" cy="30" r="11" fill={body} stroke={accent} strokeWidth="2.5" />
          <rect x="56.5" y="36" width="7" height="16" rx="3.5" fill={body} stroke={accent} strokeWidth="2.5" />
          <circle cx="48" cy="63" r="3.5" fill={accent} />
        </svg>
      );
    case 'speaker':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="sp-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accentSoft} />
              <stop offset="100%" stopColor={body} />
            </linearGradient>
          </defs>
          <rect x="26" y="14" width="44" height="68" rx="12" fill="url(#sp-g)" stroke={stroke} />
          <circle cx="48" cy="56" r="15" fill={body} stroke={accent} strokeWidth="3" />
          <circle cx="48" cy="56" r="6" fill={accent} opacity="0.7" />
          <circle cx="48" cy="29" r="7" fill={body} stroke={accent} strokeWidth="2.5" />
        </svg>
      );
    case 'microphone':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="mc-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accentSoft} />
              <stop offset="100%" stopColor={body} />
            </linearGradient>
          </defs>
          <rect x="36" y="12" width="24" height="42" rx="12" fill="url(#mc-g)" stroke={accent} strokeWidth="2.5" />
          <path d="M26 44v2c0 12.15 9.85 22 22 22s22-9.85 22-22v-2" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          <path d="M48 68v14" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          <path d="M36 84h24" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          <path d="M42 24h12M42 32h12M42 40h12" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'soundbar':
      return (
        <svg {...common}>
          <rect x="8" y="38" width="80" height="20" rx="10" fill={body} stroke={stroke} />
          <circle cx="24" cy="48" r="5" fill={accent} opacity="0.7" />
          <circle cx="42" cy="48" r="5" fill={accent} opacity="0.5" />
          <circle cx="60" cy="48" r="5" fill={accent} opacity="0.5" />
          <circle cx="78" cy="48" r="5" fill={accent} opacity="0.7" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="20" y="20" width="56" height="56" rx="16" fill={body} stroke={stroke} />
          <circle cx="48" cy="48" r="14" fill="none" stroke={accent} strokeWidth="3" />
          <circle cx="48" cy="48" r="5" fill={accent} />
        </svg>
      );
  }
}
