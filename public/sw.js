// Service worker da GERA, escrito à mão (sem Workbox).
// Navegação: rede primeiro, com a última página guardada para quando estiver offline.
// Arquivos estáticos (JS, CSS, ícones): cache primeiro, porque o nome muda a cada build.
const VERSAO = 'v1';
const CACHE = `gera-${VERSAO}`;
const BASE = new URL('./', self.location).pathname;
const ESSENCIAIS = [BASE, `${BASE}manifest.webmanifest`, `${BASE}icons/gera-app-icon.svg`, `${BASE}icons/icon-192.png`];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ESSENCIAIS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c.startsWith('gera-') && c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

const ESTATICO = /\.(?:js|css|svg|png|jpg|webp|woff2?|webmanifest)$/;

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // O app é uma SPA: qualquer rota usa o mesmo index.html, guardado na raiz do escopo.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(CACHE).then((cache) => cache.put(BASE, copia));
          }
          return res;
        })
        .catch(() => caches.match(BASE).then((r) => r || Response.error())),
    );
    return;
  }

  if (ESTATICO.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (guardado) =>
          guardado ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copia = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copia));
            }
            return res;
          }),
      ),
    );
  }
});
