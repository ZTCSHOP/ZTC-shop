import { supabase, isCloudEnabled } from './supabase'

const BUCKET = 'media'
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || ''

// Préfixe des URLs publiques de notre bucket
export const MEDIA_BASE = SUPA_URL ? `${SUPA_URL}/storage/v1/object/public/${BUCKET}/` : ''

// Cloudflare R2 (0 egress) — si configuré, on privilégie R2 au Storage Supabase
const R2_WORKER = (import.meta.env.VITE_R2_WORKER_URL || '').replace(/\/$/, '')
export const R2_BASE = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '')
export const R2_ENABLED = R2_WORKER !== ''

// Une valeur "image" = base64 (ancien) OU une URL de notre Storage / R2
export function isImageValue(v){
  return typeof v === 'string' && (
    v.startsWith('data:image') ||
    (MEDIA_BASE !== '' && v.startsWith(MEDIA_BASE)) ||
    (R2_BASE !== '' && v.startsWith(R2_BASE))
  )
}

function dataUrlToBlob(dataUrl){
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.slice(0, comma)
  const b64 = dataUrl.slice(comma + 1)
  const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/jpeg'
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// Upload une image (dataURL base64 ou File/Blob) vers Supabase Storage.
// Retourne l'URL publique. En mode hors-ligne (pas de cloud) → renvoie la valeur d'origine.
export async function uploadImage(input, folder = 'misc'){
  if(!input) return ''
  if(typeof input === 'string'){
    if(input.startsWith('http')) return input          // déjà une URL (Storage ou externe)
    if(!input.startsWith('data:')) return input
  }
  // Pas de cloud : on garde le base64 local (mode démo)
  if(!isCloudEnabled && !R2_ENABLED) return typeof input === 'string' ? input : ''

  const blob = (input instanceof Blob) ? input : dataUrlToBlob(input)

  // 1) Cloudflare R2 (0 egress) si le Worker est configuré
  if(R2_ENABLED){
    const fd = new FormData()
    fd.append('file', blob, `img.${(blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`)
    fd.append('folder', folder)
    const res = await fetch(`${R2_WORKER}/upload`, { method: 'POST', body: fd })
    if(!res.ok) throw new Error(`r2_upload_${res.status}`)
    const data = await res.json()
    if(!data || !data.url) throw new Error('r2_no_url')
    return data.url
  }

  // 2) Fallback : Supabase Storage
  const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  })
  if(error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
