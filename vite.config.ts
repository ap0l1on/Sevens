import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vite.dev/config/
export default defineConfig({
  // Project pages serve at /Sevens/. Use '/' only with a custom domain.
  base: '/Sevens/',
  plugins: [preact()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
  },
});
