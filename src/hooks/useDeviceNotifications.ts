import { useEffect } from 'react';
import { bridge } from '@/api/bridge';
import { useUi } from '@/store/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { deviceLabel } from '@/utils';

/** Subscribes to device connect/disconnect/low-battery events and shows animated toasts. */
export function useDeviceNotifications(): void {
  const pushToast = useUi((s) => s.pushToast);
  const { t } = useTranslation();

  useEffect(() => {
    const offConnect = bridge.devices.onConnected((device) => {
      pushToast({
        kind: 'device',
        title: t('notif.deviceConnected'),
        body: deviceLabel(device),
        battery: device.battery.combined,
      });
    });
    const offDisconnect = bridge.devices.onDisconnected((device) => {
      pushToast({
        kind: 'info',
        title: t('notif.deviceDisconnected'),
        body: deviceLabel(device),
      });
    });
    const offLow = bridge.devices.onBatteryLow(({ device, level }) => {
      pushToast({
        kind: 'warning',
        title: t('notif.lowBattery'),
        body: `${deviceLabel(device)} — %${level}`,
        battery: level,
        duration: 6000,
      });
    });
    return () => {
      offConnect();
      offDisconnect();
      offLow();
    };
  }, [pushToast, t]);
}
