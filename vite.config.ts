import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        game: 'index.html',
        assetEditor: 'asset-editor.html',
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
  },
});
