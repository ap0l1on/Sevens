import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  // Project pages serve at /Sevens/. Use '/' only with a custom domain.
  base: '/Sevens/',
  plugins: [preact()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        subject: resolve(__dirname, 'subject.html'),
      },
    },
  },
});
