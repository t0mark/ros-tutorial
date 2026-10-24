import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  build: {
    outDir: '../../docs/tools/ros',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        turtlesim: fileURLToPath(new URL('turtlesim-popup.html', import.meta.url)),
        rqtGraph: fileURLToPath(new URL('rqt-graph-popup.html', import.meta.url)),
      },
    },
  },
});
