import { build } from 'esbuild';

const common = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['electron'],
  outdir: 'dist-electron',
  sourcemap: false,
  minify: false,
};

await build({
  ...common,
  entryPoints: ['electron/main.ts'],
  format: 'cjs',
});

await build({
  ...common,
  entryPoints: ['electron/preload.ts'],
  format: 'cjs',
});

console.log('✓ Electron main & preload built to dist-electron/');
