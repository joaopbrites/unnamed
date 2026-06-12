import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '404.html',
    }),
    paths: {
      base: process.env.NODE_ENV === 'production' ? '/unnamed' : '',
    },
    prerender: {
      // Não derruba o build inteiro por um asset 404 (ex.: imagem faltando);
      // apenas avisa. Erros de página continuam falhando o build.
      handleHttpError: ({ path, message }) => {
        console.warn(`[prerender] ignorando recurso ausente: ${path} — ${message}`);
      },
      // Rotas dinâmicas (/events/[id], /profile/[id], etc.) não são prerenderadas:
      // são servidas pelo fallback SPA (404.html) e resolvidas no cliente. Intencional.
      handleUnseenRoutes: 'ignore',
    },
  },
};

export default config;
