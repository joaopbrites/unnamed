import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath, URL } from 'url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    conditions: ['browser'],
    alias: {
      '$lib': r('./src/lib'),
      '$app/environment': r('./src/__mocks__/app-environment.js'),
      '$app/navigation': r('./src/__mocks__/app-navigation.js'),
      '$app/stores': r('./src/__mocks__/app-stores.js'),
    },
  },
  test: {
    include: ['src/**/*.test.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['src/setupTests.js'],
    globals: true,
  },
});
