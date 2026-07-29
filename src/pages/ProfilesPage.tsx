import { motion } from 'framer-motion';
import { Gamepad2, Music, Film, Briefcase, Radio, Sparkles, Headphones, Mic } from 'lucide-react';
import { useDevices } from '@/hooks/useAudioData';
import { useTranslation } from '@/hooks/useTranslation';
import { useProfiles } from '@/store/profiles';
import { bridge } from '@/api/bridge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn, deviceLabel } from '@/utils';
import { useUi } from '@/store/ui';
import type { ProfileKind } from '@/types/audio';

const PROFILE_ICONS: Record<ProfileKind, typeof Gamepad2> = {
  gaming: Gamepad2,
  music: Music,
  movie: Film,
  meeting: Briefcase,
  streaming: Radio,
};

const PROFILE_TONES: Record<ProfileKind, string> = {
  gaming: 'from-violet-500/20 to-violet-600/5',
  music: 'from-emerald-500/20 to-emerald-600/5',
  movie: 'from-amber-500/20 to-amber-600/5',
  meeting: 'from-sky-500/20 to-sky-600/5',
  streaming: 'from-rose-500/20 to-rose-600/5',
};

/** Smart Profiles — scenario-based automatic device switching. */
export function ProfilesPage() {
  const { t } = useTranslation();
  const profiles = useProfiles((s) => s.profiles);
  const activateProfile = useProfiles((s) => s.activateProfile);
  const updateProfile = useProfiles((s) => s.updateProfile);
  const devices = useDevices();
  const pushToast = useUi((s) => s.pushToast);

  const outputOptions: SelectOption[] = devices
    .filter((d) => d.kind !== 'microphone' && d.status === 'connected')
    .map((d) => ({ value: d.id, label: deviceLabel(d) }));

  const micOptions: SelectOption[] = [
    { value: '', label: '—' },
    ...devices
      .filter((d) => d.kind === 'microphone' && d.status === 'connected')
      .map((d) => ({ value: d.id, label: deviceLabel(d) })),
  ];

  const applyProfile = async (id: ProfileKind) => {
    const profile = activateProfile(id);
    if (profile) {
      if (profile.outputDeviceId) await bridge.devices.setDefault(profile.outputDeviceId);
      if (profile.micDeviceId) await bridge.mic.update({ deviceId: profile.micDeviceId, noiseSuppression: profile.noiseSuppression });
      if (profile.outputDeviceId) await bridge.devices.setVolume(profile.outputDeviceId, profile.volume);
      pushToast({ kind: 'success', title: `${t(`profiles.${id}`)} ${t('notif.profileActivated')}` });
    }
  };

  return (
    <div className="p-6">
      <PageHeader title={t('profiles.title')} subtitle={t('profiles.subtitle')} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {profiles.map((p, i) => {
          const Icon = PROFILE_ICONS[p.id];
          const tone = PROFILE_TONES[p.id];
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard gradient hoverable className={cn('relative overflow-hidden', p.active && 'ring-2 ring-accent/40')}>
                {/* Gradient background */}
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-30 pointer-events-none', tone)} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-control bg-[rgb(var(--surface-overlay)/0.6)]">
                        <Icon size={18} className="text-accent" />
                      </div>
                      <h3 className="text-lg font-bold">{t(`profiles.${p.id}`)}</h3>
                    </div>
                    {p.active ? (
                      <Badge tone="success"><Sparkles size={11} /> {t('profiles.active')}</Badge>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => applyProfile(p.id)}>
                        <Sparkles size={12} /> {t('profiles.activate')}
                      </Button>
                    )}
                  </div>

                  <div className="mt-5 space-y-3">
                    <div>
                      <label className="text-[11px] text-ink-dim flex items-center gap-1">
                        <Headphones size={11} /> {t('profiles.outputDevice')}
                      </label>
                      <Select
                        value={p.outputDeviceId ?? ''}
                        options={outputOptions}
                        onChange={(v) => updateProfile(p.id, { outputDeviceId: v || null })}
                        className="mt-1"
                        compact
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-ink-dim flex items-center gap-1">
                        <Mic size={11} /> {t('profiles.micDevice')}
                      </label>
                      <Select
                        value={p.micDeviceId ?? ''}
                        options={micOptions}
                        onChange={(v) => updateProfile(p.id, { micDeviceId: v || null })}
                        className="mt-1"
                        compact
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-ink-dim">{t('common.volume')}</span>
                      <span className="text-xs font-semibold tabular-nums">{p.volume}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-ink-dim">{t('mic.noiseSuppression')}</span>
                      <Toggle
                        checked={p.noiseSuppression}
                        onChange={(v) => updateProfile(p.id, { noiseSuppression: v })}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
