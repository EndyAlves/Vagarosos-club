import { defineConfig } from 'vite';

// Endereço público do site (para a prévia no WhatsApp/Instagram).
// Na Vercel ele é preenchido sozinho; para domínio próprio, defina VITE_SITE_URL.
const siteUrl = (
  process.env.VITE_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  'http://localhost:5173'
).replace(/\/$/, '');

export default defineConfig({
  plugins: [{
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
  }],
  build: { target: 'es2020', sourcemap: false },
});
