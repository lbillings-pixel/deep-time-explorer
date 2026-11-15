import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: { main: 'index.html', scenes: 'scenes.html', credits: 'credits.html', about: 'about.html' },
    },
  },
});
