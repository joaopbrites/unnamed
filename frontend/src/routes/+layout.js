// prerender=true gera HTML estático (index.html) para as rotas alcançáveis,
// garantindo que a home do GitHub Pages responda 200 em vez de 404.
// ssr=false mantém o app como SPA (sem dados no HTML; tudo via fetch no cliente).
// Rotas dinâmicas ([id]) não são alcançadas pelo crawler e caem no fallback 404.html.
export const prerender = true;
export const ssr = false;
