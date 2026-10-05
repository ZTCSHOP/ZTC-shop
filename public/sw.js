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
