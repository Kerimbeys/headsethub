import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useDeviceNotifications } from '@/hooks/useDeviceNotifications';
import { TitleBar } from '@/components/layout/TitleBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastHost } from '@/components/layout/ToastHost';
import { useUi } from '@/store/ui';
import { DashboardPage } from '@/pages/DashboardPage';
import { DevicesPage } from '@/pages/DevicesPage';
import { BluetoothPage } from '@/pages/BluetoothPage';
import { MixerPage } from '@/pages/MixerPage';
import { MicrophonePage } from '@/pages/MicrophonePage';
import { EqualizerPage } from '@/pages/EqualizerPage';
import { BatteryPage } from '@/pages/BatteryPage';
import { ProfilesPage } from '@/pages/ProfilesPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { SettingsPage } from '@/pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const PAGES: Record<string, () => React.ReactElement> = {
  dashboard: DashboardPage,
  devices: DevicesPage,
  bluetooth: BluetoothPage,
  mixer: MixerPage,
  microphone: MicrophonePage,
  equalizer: EqualizerPage,
  battery: BatteryPage,
  profiles: ProfilesPage,
  tools: ToolsPage,
  settings: SettingsPage,
};

function Shell() {
  const page = useUi((s) => s.page);
  const Page = PAGES[page] ?? DashboardPage;
  useTheme();
  useDeviceNotifications();
  return (
    <div className="ambient-glow relative flex h-screen flex-col overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Page />
        </main>
      </div>
      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  );
}
