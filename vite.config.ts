import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // In Vite 8 (rolldown), manualChunks must be a function
        manualChunks: (id: string) => {
          if (id.includes('phaser')) return 'phaser';
          return undefined;
        },
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },
});