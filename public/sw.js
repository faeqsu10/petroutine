const CACHE_NAME = 'petroutine-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/logo-horizontal.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: 정적 자산 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: 이전 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: 정적 자산은 Cache First, 나머지는 Network First
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // http(s) 이외의 스킴(chrome-extension 등)은 캐시 불가 → 무시
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Auth/helper 경로는 sessionStorage 및 redirect 상태에 민감하므로 SW 캐시를 우회한다.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__/') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/signup') ||
    url.pathname.startsWith('/welcome') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  // 정적 자산(JS, CSS, 이미지, 폰트): Cache First → 네트워크 왕복 없이 즉시 반환
  if (/\.(js|css|png|svg|jpg|jpeg|webp|woff2?)(\?|$)/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // 나머지(HTML 페이지 등): Network First, 오프라인 시 캐시 폴백
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push 알림 수신
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.notification?.title ?? 'Petroutine';
  const options = {
    body: data.notification?.body ?? '케어 알림이 있어요',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.data?.tag ?? 'care-reminder',
    data: { url: data.fcmOptions?.link ?? data.data?.url ?? '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
