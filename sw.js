// Guarda o app no aparelho para funcionar sem internet.
// A página principal busca a versão nova quando há internet e usa a cópia guardada quando não há.
// Ao publicar mudanças em arquivos que não sejam o index.html, aumente a VERSAO.
const VERSAO = 'divide-v8';
const ARQUIVOS = ['./', './index.html', './tokens.css', './manifest.webmanifest', './icone-192.png', './icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Página: rede primeiro (pega atualizações), cópia guardada se estiver offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(resp => { const copia = resp.clone(); caches.open(VERSAO).then(c => c.put('./index.html', copia)); return resp; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Demais arquivos (ícones, fonte): cópia guardada primeiro, rede como reserva.
  e.respondWith(
    caches.match(req).then(guardado => guardado || fetch(req).then(resp => {
      if (resp.ok || resp.type === 'opaque') { const copia = resp.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return resp;
    }))
  );
});
