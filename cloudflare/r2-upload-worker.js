// ============================================================
//  ZTC Shop — Cloudflare Worker : upload d'images vers R2
//  ------------------------------------------------------------
//  Binding R2   : BUCKET  (le bucket "ztc-media")
//  Variable     : PUBLIC_BASE = URL publique du bucket
//                 (ex: https://pub-xxxxxxxx.r2.dev  ou  https://media.tondomaine.com)
//  ------------------------------------------------------------
//  Déploiement : Cloudflare Dashboard > Workers & Pages > Create
//                > "Create Worker" > colle ce code > Deploy
//                puis Settings > Variables > ajoute PUBLIC_BASE
//                puis Settings > Bindings > R2 Bucket = BUCKET -> ztc-media
// ============================================================

const ALLOWED_ORIGINS = [
  'https://ztcshop.github.io',
  'https://ztc-shop.tn',
  'https://www.ztc-shop.tn',
]

function cors(origin){
  const allow = !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}
function json(obj, status, origin){
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  })
}

export default {
  async fetch(request, env){
    const origin = request.headers.get('Origin')
    if(request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })

    const url = new URL(request.url)
    if(url.pathname !== '/upload' || request.method !== 'POST'){
      return json({ error: 'not found' }, 404, origin)
    }

    let form
    try{ form = await request.formData() }
    catch{ return json({ error: 'bad form' }, 400, origin) }

    const file = form.get('file')
    const folder = (String(form.get('folder') || 'misc').replace(/[^a-z0-9_-]/gi, '') || 'misc')

    if(!file || typeof file === 'string') return json({ error: 'no file' }, 400, origin)
    if(!/^image\//.test(file.type)) return json({ error: 'not an image' }, 415, origin)
    if(file.size > 5 * 1024 * 1024) return json({ error: 'too big (max 5MB)' }, 413, origin)

    const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    try{
      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
      })
    }catch(e){
      return json({ error: 'upload failed: ' + e.message }, 500, origin)
    }

    const base = (env.PUBLIC_BASE || '').replace(/\/$/, '')
    if(!base) return json({ error: 'PUBLIC_BASE not set' }, 500, origin)
    return json({ url: `${base}/${key}` }, 200, origin)
  },
}
