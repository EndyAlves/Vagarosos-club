// Service worker: deixa o site abrir rápido e funcionar como app instalado.
// Dados do clube (Supabase) nunca ficam em cache: sempre vêm atualizados.
const CACHE = 'vagarosos-v2';
const SHELL = ['/', '/manifest.webmanifest', '/img/logo.webp', '/fonts/sprite.woff2', '/fonts/neue.woff2', '/fonts/neue-bold.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // páginas: rede primeiro, cache se estiver offline
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('/', copy)); return res; })
      .catch(() => caches.match('/')));
    return;
  }
  // arquivos estáticos: cache primeiro, atualiza em segundo plano
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; });
    return hit || net;
  }));
});
