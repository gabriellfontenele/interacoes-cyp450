// Service worker: app disponível offline.
// Ao publicar uma nova versão, altere VERSAO para renovar o cache.
var VERSAO = "cyp-v1";
var ARQUIVOS = [
  "./",
  "index.html",
  "dados.html",
  "css/app.css",
  "js/data.js",
  "js/engine.js",
  "js/app.js",
  "manifest.webmanifest",
  "img/simbolo.png",
  "img/logo-horizontal.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/favicon-48.png",
  "icons/apple-touch-icon.png"
];
var FONTES = "cyp-fontes";

self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (chaves) {
      return Promise.all(chaves.filter(function (k) { return k !== VERSAO && k !== FONTES; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // Google Fonts: cache após o primeiro acesso
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    ev.respondWith(caches.open(FONTES).then(function (c) {
      return c.match(req).then(function (r) {
        var rede = fetch(req).then(function (resp) { c.put(req, resp.clone()); return resp; });
        return r || rede;
      });
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Arquivos do app: responde do cache e atualiza em segundo plano
  ev.respondWith(caches.open(VERSAO).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (r) {
      var rede = fetch(req).then(function (resp) {
        if (resp.ok) c.put(req, resp.clone());
        return resp;
      }).catch(function () { return r; });
      return r || rede;
    });
  }));
});
