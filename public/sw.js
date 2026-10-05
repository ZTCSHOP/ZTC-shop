/* ZTC Shop — Service Worker (PWA offline de base) */
const CACHE = 'ztc-v1'
const SHELL = ['./', './index.html', './manifest.webmanifest', './logo.jpg']

self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE).then(c=> c.addAll(SHELL)).then(()=> self.skipWaiting()).catch(()=> self.skipWaiting())
  )
})

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys()
      .then(keys=> Promise.all(keys.filter(k=> k !== CACHE).map(k=> caches.delete(k))))
      .then(()=> self.clients.claim())
  )
})

self.addEventListener('fetch', (e)=>{
  const { request } = e
  if(request.method !== 'GET') return
  const url = new URL(request.url)
  // Navigations : network-first, repli sur index.html en cache (offline)
  if(request.mode === 'navigate'){
    e.respondWith(
      fetch(request)
        .then(res=>{
          const copy = res.clone()
          caches.open(CACHE).then(c=> c.put('./index.html', copy)).catch(()=>{})
          return res
        })
        .catch(()=> caches.match('./index.html'))
    )
    return
  }
  // Même origine (JS/CSS/images locales) : cache-first + mise à jour en tâche de fond
  if(url.origin === self.location.origin){
    e.respondWith(
      caches.match(request).then(cached=>{
        const net = fetch(request).then(res=>{
          if(res && res.ok){
            const copy = res.clone()
            caches.open(CACHE).then(c=> c.put(request, copy)).catch(()=>{})
          }
          return res
        }).catch(()=> cached)
        return cached || net
      })
    )
  }
})

// ---- Web Push : notification système (téléphone + PC, même app fermée) ----
self.addEventListener('push', (e)=>{
  let d = {}
  try{ d = e.data ? e.data.json() : {} }catch{}
  e.waitUntil(
    self.registration.showNotification(d.title || 'ZTC Shop', {
      body: d.body || 'Nouveau message',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      data: { url: d.url || './' },
    })
  )
})

self.addEventListener('notificationclick', (e)=>{
  e.notification.close()
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list=>{
      for(const c of list){
        if(new URL(c.url).origin === new URL(url).origin){ c.navigate(url); return c.focus() }
      }
      return self.clients.openWindow(url)
    })
  )
})
