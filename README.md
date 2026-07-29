<p align="center">
  <img src="build/icon.ico" alt="HeadsetHub Logo" width="128" />
</p>

<h1 align="center">HeadsetHub</h1>

<p align="center">
  <strong>The ultimate premium audio device manager for Windows</strong>
</p>

<p align="center">
  <a href="https://electronjs.org"><img src="https://img.shields.io/badge/Electron-33.2-47848F?style=for-the-badge&logo=electron&logoColor=white" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" /></a>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#building">Building</a> ·
  <a href="#contributing">Contributing</a> ·
  <a href="#license">License</a>
</p>

---

Inspired by **Microsoft Fluent Design**, **SteelSeries GG**, **Nothing OS** and **Logitech G HUB**. HeadsetHub is a native Windows desktop application that puts you in full control of your audio devices — from Bluetooth headsets to USB microphones.

![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D4?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/Type-100%25-3178C6?style=flat-square)

---

## Features

### Dashboard
- Real-time device overview with premium SVG illustrations
- Per-ear battery tracking (Left / Right / Case)
- Codec detection (AAC, SBC, aptX, LDAC)
- Signal strength, latency, sample rate & bit depth
- Circular volume knob with mute toggle
- Now-playing widget with album art and playback controls

### Connected Devices
- Animated card grid with battery, connection type and codec badges
- Connect, disconnect, set default, rename and forget actions
- Real-time status indicators

### Bluetooth Manager
- Scan nearby devices with live RSSI signal bars
- Pair, forget and reconnect with animated progress
- Auto-reconnect toggle per device

### Audio Mixer (EarTrumpet-style)
- Per-application volume sliders
- Per-app output device routing
- Real-time volume meters with brand-styled icons

### Microphone
- Live waveform visualisation (Canvas + WebAudio)
- Noise suppression and push-to-talk toggles
- Gain control (-12 to +24 dB)
- Microphone test with recording animation

### 10-Band Equalizer
- Full spectrum (32 Hz – 16 kHz)
- Built-in presets (Flat, Bass Boost, Treble Boost, Vocal, Gaming)
- Custom preset save / delete
- Cloud sync toggle

### Battery History
- Interactive line charts (Recharts) with daily / weekly views
- Per-device selection sidebar
- Estimated remaining hours

### Smart Profiles
- Gaming / Music / Movie / Meeting / Streaming
- Auto-switch output device, microphone, volume and noise suppression

### Floating Widgets
- Small: Device + battery + volume
- Medium: Music player controls
- Large: Audio mixer preview
- Always-on-top, frameless, draggable

### Tools
- Headphone Finder (play sound to locate device)
- Firmware & driver checker
- Windows Audio Service restart
- Device diagnostics (latency, jitter, packet loss)
- Sound tests: Left/Right channel, Bass, Treble, Surround

### Settings
- 6 languages: Turkish, English, German, French, Italian, Japanese
- 3 themes: Light, Dark, OLED (Pure Black)
- 6 accent colours: Blue, Purple, Orange, Green, Red, Pink
- Customisable glass opacity, blur intensity, corner radius
- Discord Rich Presence & OBS integration toggles
- Startup with Windows

---

## Screenshots

> Screenshots will be added once the application is running on a Windows machine.

| Dashboard | Mixer | Equalizer |
|:---------:|:-----:|:---------:|
| *[Screenshot]* | *[Screenshot]* | *[Screenshot]* |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Electron 33 |
| Renderer | React 18 + TypeScript |
| Build | Vite 6 + esbuild |
| Styling | TailwindCSS 3 |
| Animations | Framer Motion |
| State | Zustand + React Query |
| Icons | Lucide React |
| Charts | Recharts |

---

## Architecture

```
headsethub/
├── electron/          # Main process (Node.js)
│   ├── main.ts        # Window, tray, widget lifecycle + IPC
│   ├── preload.ts     # Typed contextBridge
│   ├── audio-engine.ts# Windows Core Audio + simulation engine
│   └── shared-types.ts# Shared IPC type definitions
├── src/
│   ├── api/           # Bridge API (Electron + browser fallback)
│   ├── components/
│   │   ├── ui/        # Reusable glass primitives
│   │   └── layout/    # TitleBar, Sidebar, ToastHost, Widget
│   ├── pages/         # 10 feature pages
│   ├── store/         # Zustand stores (theme, eq, profiles, ui)
│   ├── hooks/         # Custom React hooks
│   ├── i18n/          # 6-language translations
│   ├── styles/        # Tailwind + glassmorphism tokens
│   └── utils/         # Helpers, formatters, colour utils
├── build/
│   └── icon.ico       # App icon
└── index.html
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** (`npm install -g pnpm`)
- **Windows 10/11** (for native audio features)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/your-username/headsethub.git
cd headsethub

# Install dependencies
pnpm install

# Start development server (browser simulation mode)
pnpm dev
# Open http://localhost:5173

# Or run as Electron app
pnpm start
```

---

## Building

### Windows Installer (.exe)

```bash
pnpm dist
```

Produces an NSIS installer in `release/HeadsetHub Setup 1.0.0.exe`.

### Portable Build (no installer)

```bash
pnpm dist:dir
```

Outputs `release/win-unpacked/HeadsetHub.exe` — double-click to run.

---

## Windows Native Features

When running as an Electron app on Windows, the app uses real OS APIs:

| Feature | Implementation |
|---------|---------------|
| Device enumeration | Windows Core Audio API via PowerShell |
| Volume / mute | `Set-AudioDevice` cmdlets |
| Default device | `Set-DefaultAudioDevice` |
| Battery levels | Bluetooth GATT + WinRT |
| Bluetooth scanning | `Get-PnpDevice` |
| Auto-launch | Registry `Run` key |
| System tray | Electron `Tray` + native menus |
| Widgets | Frameless always-on-top `BrowserWindow` |

On non-Windows or in a browser, the app falls back to a **full simulation engine** with identical UI behaviour.

---

## Contributing

Contributions are welcome! Here is how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by the HeadsetHub Team
</p>
