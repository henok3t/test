import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built app works from any folder or sub-path (GitHub Pages, a USB stick, etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2019', assetsInlineLimit: 0 },
});
