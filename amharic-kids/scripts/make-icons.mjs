// Renders the app icons (public/icons/*.png) from the same lion artwork the app uses.
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const entry = `
  import { renderToStaticMarkup } from 'react-dom/server';
  import { LionFace } from './src/art/Anbessa.tsx';
  export const svg = (pad) => renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">
      <defs><radialGradient id="bg" cx="0.5" cy="0.35" r="0.8"><stop offset="0" stopColor="#FFF3A8"/><stop offset="1" stopColor="#FFC531"/></radialGradient></defs>
      <rect width="200" height="200" fill="url(#bg)"/>
      <g transform={\`translate(\${100 - 100 * pad} \${100 - 92 * pad}) scale(\${pad})\`}><LionFace happy /></g>
    </svg>);
`;
const out = await build({ stdin: { contents: entry, resolveDir: root, loader: 'tsx' }, bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false, jsx: 'automatic' });
const tmp = `${root}node_modules/.icon-render.mjs`;
writeFileSync(tmp, out.outputFiles[0].text);
const { svg } = await import(tmp);

const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
mkdirSync(`${root}public/icons`, { recursive: true });
const shots = [
  ['icon-512.png', 512, 1.05], ['icon-192.png', 192, 1.05], ['apple-touch-icon.png', 180, 1.0], ['icon-maskable-512.png', 512, 0.78],
];
for (const [name, size, pad] of shots) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg(pad)}`);
  await page.screenshot({ path: `${root}public/icons/${name}` });
  console.log('made', name);
}
await browser.close();
