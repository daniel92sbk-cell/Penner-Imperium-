// Bei jedem Deploy mit sichtbaren Änderungen die Versionsnummer erhöhen,
// damit Spieler die neue Version bekommen statt einer alten aus dem Cache.
const CACHE_NAME = 'penner-imperium-v1';

const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon-512-maskable.png',
    './Gemini_Generated_Image_m3jjprm3jjprm3jj.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {
            // Einzelne fehlende Dateien (z.B. falscher Pfad) sollen die Installation nicht blockieren
        }))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // HTML-Seite: zuerst Netzwerk versuchen, damit Updates sofort ankommen.
    // Nur offline auf die zwischengespeicherte Version zurückfallen.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
                    return res;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Statische Assets (Icons, Manifest, Hintergrundbild): zuerst Cache, dann Netzwerk.
    event.respondWith(
        caches.match(req).then((cached) => cached || fetch(req).then((res) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
            return res;
        }))
    );
});
