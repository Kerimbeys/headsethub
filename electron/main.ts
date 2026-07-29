import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, shell } from 'electron';
import path from 'path';
import { AudioEngine } from './audio-engine';
import { WidgetSize, BluetoothScanResult, MicState } from './shared-types';

const IS_DEV = !!process.env.VITE_DEV_SERVER_URL;
const DEV_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const widgetWindows = new Map<WidgetSize, BrowserWindow>();
const engine = new AudioEngine();

/* ------------------------------------------------------------------ */
/* Window creation                                                     */
/* ------------------------------------------------------------------ */

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    show: false,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (IS_DEV) {
    void mainWindow.loadURL(DEV_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.on('close', (e) => {
    if (!(app as unknown as { isQuitting?: boolean }).isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
}

const WIDGET_DIMENSIONS: Record<WidgetSize, { width: number; height: number }> = {
  small: { width: 320, height: 130 },
  medium: { width: 360, height: 200 },
  large: { width: 400, height: 480 },
};

function toggleWidget(size: WidgetSize): boolean {
  const existing = widgetWindows.get(size);
  if (existing && !existing.isDestroyed()) {
    existing.close();
    widgetWindows.delete(size);
    return false;
  }
  const dims = WIDGET_DIMENSIONS[size];
  const win = new BrowserWindow({
    ...dims,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  const query = `?size=${size}`;
  if (IS_DEV) {
    void win.loadURL(`${DEV_URL}/widget.html${query}`);
  } else {
    void win.loadFile(path.join(__dirname, '../dist/widget.html'), { search: query });
  }
  win.on('closed', () => widgetWindows.delete(size));
  widgetWindows.set(size, win);
  return true;
}

/* ------------------------------------------------------------------ */
/* Tray                                                                */
/* ------------------------------------------------------------------ */

function createTray(): void {
  // 16x16 headphone glyph rendered as a data URL PNG (accent colored dot).
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAmklEQVR4nKWTUQ6AIAxDW+9/aP3SkLnCVvhSWPra4gCJVSTvKk8kkTIBAODuTM8SYIrsxG8ADQlmt7uBTgLTB7fSaGyBGYDp3aUFfAFcnl3AqLKrgt0dSPMXCNKrpguFdN5MoVoAO52rIGnbaCUn/8ClJ9BJ2Xy4TW1J49lIByeqxKRE9wLK9GmEXfEXoDx91XLqWvI3/uUBaqRfjuLQOR8AAAAASUVORK5CYII=',
  );
  tray = new Tray(icon);
  tray.setToolTip('HeadsetHub');
  const menu = Menu.buildFromTemplate([
    { label: 'HeadsetHub\'ı Aç', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Küçük Widget', click: () => toggleWidget('small') },
    { label: 'Müzik Widget\'ı', click: () => toggleWidget('medium') },
    { label: 'Mixer Widget\'ı', click: () => toggleWidget('large') },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        (app as unknown as { isQuitting?: boolean }).isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.on('double-click', () => mainWindow?.show());
}

/* ------------------------------------------------------------------ */
/* IPC wiring                                                          */
/* ------------------------------------------------------------------ */

function broadcast(channel: string, payload: unknown): void {
  const targets = [mainWindow, ...widgetWindows.values()];
  for (const w of targets) {
    if (w && !w.isDestroyed()) w.webContents.send(channel, payload);
  }
}

function registerIpc(): void {
  ipcMain.handle('system:info', () => ({
    platform: process.platform,
    isWindows: process.platform === 'win32',
    simulated: engine.isSimulated(),
    appVersion: app.getVersion(),
  }));

  ipcMain.handle('devices:list', () => engine.getDevices());
  ipcMain.handle('devices:setVolume', (_e, id: string, v: number) => engine.setDeviceVolume(id, v));
  ipcMain.handle('devices:setMute', (_e, id: string, m: boolean) => engine.setDeviceMute(id, m));
  ipcMain.handle('devices:setDefault', (_e, id: string, comm: boolean) => engine.setDefaultDevice(id, comm));
  ipcMain.handle('devices:rename', (_e, id: string, name: string | null) => engine.renameDevice(id, name));
  ipcMain.handle('devices:connect', (_e, id: string) => engine.connectDevice(id));
  ipcMain.handle('devices:disconnect', (_e, id: string) => engine.disconnectDevice(id));
  ipcMain.handle('devices:forget', (_e, id: string) => engine.forgetDevice(id));
  ipcMain.handle('devices:diagnostics', (_e, id: string) => engine.runDiagnostics(id));

  ipcMain.handle('bt:scan', () => engine.startScan());
  ipcMain.handle('bt:pair', (_e, r: BluetoothScanResult) => engine.pairDevice(r));

  ipcMain.handle('sessions:list', () => engine.getSessions());
  ipcMain.handle('sessions:setVolume', (_e, id: string, v: number) => engine.setSessionVolume(id, v));
  ipcMain.handle('sessions:setMute', (_e, id: string, m: boolean) => engine.setSessionMute(id, m));
  ipcMain.handle('sessions:setOutput', (_e, id: string, devId: string) => engine.setSessionOutput(id, devId));

  ipcMain.handle('mic:get', () => engine.getMicState());
  ipcMain.handle('mic:update', (_e, partial: Partial<MicState>) => engine.updateMic(partial));

  ipcMain.handle('media:get', () => engine.getMediaSession());
  ipcMain.handle('media:control', (_e, action: 'play' | 'pause' | 'next' | 'previous') =>
    engine.mediaControl(action),
  );

  ipcMain.handle('battery:history', (_e, deviceId: string, sinceMs: number) =>
    engine.getBatteryHistory(deviceId, sinceMs),
  );

  ipcMain.handle('audio:restartService', () => engine.restartAudioService());

  ipcMain.handle('widgets:toggle', (_e, size: WidgetSize) => toggleWidget(size));

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.hide());
  ipcMain.handle('widget:close', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    win?.close();
  });

  ipcMain.handle('app:setAutoLaunch', (_e, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled });
  });

  // Engine → renderer event bridge
  engine.on('devices-updated', (d) => broadcast('event:devices-updated', d));
  engine.on('sessions-updated', (s) => broadcast('event:sessions-updated', s));
  engine.on('mic-updated', (m) => broadcast('event:mic-updated', m));
  engine.on('media-updated', (m) => broadcast('event:media-updated', m));
  engine.on('battery-sample', (b) => broadcast('event:battery-sample', b));
  engine.on('scan-result', (r) => broadcast('event:scan-result', r));
  engine.on('scan-finished', () => broadcast('event:scan-finished', null));

  engine.on('device-connected', (d) => {
    broadcast('event:device-connected', d);
    new Notification({
      title: 'Cihaz Bağlandı',
      body: `${d.customName ?? d.name}${d.battery.combined !== null ? ` — Pil %${d.battery.combined}` : ''}`,
      silent: false,
    }).show();
  });

  engine.on('device-disconnected', (d) => broadcast('event:device-disconnected', d));

  engine.on('battery-low', ({ device, level }) => {
    broadcast('event:battery-low', { device, level });
    new Notification({
      title: 'Düşük Pil Uyarısı',
      body: `${device.customName ?? device.name} pil seviyesi %${level}`,
      urgency: 'critical',
    }).show();
  });
}

/* ------------------------------------------------------------------ */
/* App lifecycle                                                       */
/* ------------------------------------------------------------------ */

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  app.whenReady().then(async () => {
    await engine.start();
    registerIpc();
    createMainWindow();
    createTray();
  });

  app.on('window-all-closed', () => {
    // Keep alive in tray on Windows; quit elsewhere.
    if (process.platform !== 'win32') app.quit();
  });

  app.on('before-quit', () => {
    (app as unknown as { isQuitting?: boolean }).isQuitting = true;
    engine.stop();
  });
}
