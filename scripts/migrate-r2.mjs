// ============================================================
//  ZTC Shop — Migration des images vers Cloudflare R2
//  Déplace les images stockées dans Supabase Storage (bucket "media")
//  (et les anciens base64) vers R2, puis met à jour les URLs en base.
//
//  Usage (PowerShell) :
//     $env:SUPABASE_SERVICE_ROLE_KEY="<cle service_role>"
//     node scripts/migrate-r2.mjs
//  (URL Worker + URL publique lues depuis .env : VITE_R2_WORKER_URL / VITE_R2_PUBLIC_URL)
// ============================================================
import fs from 'node:fs'
import { Buffer } from 'node:buffer'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'media'

function readEnvFile(p){
  try{
    const o = {}
    for(const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)){
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if(m) o[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
    return o
  }catch{ return {} }
}

const dotenv = readEnvFile('.env')
const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || dotenv.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || dotenv.SUPABASE_SERVICE_ROLE_KEY
const WORKER = (process.env.R2_WORKER_URL || dotenv.VITE_R2_WORKER_URL || '').replace(/\/$/, '')
const R2_PUBLIC = (process.env.R2_PUBLIC_URL || dotenv.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '')

if(!URL || !KEY){
  console.error('✗ Manque SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
if(!WORKER || !R2_PUBLIC){
  console.error('✗ Manque VITE_R2_WORKER_URL et/ou VITE_R2_PUBLIC_URL dans .env')
  process.exit(1)
}

const MEDIA_BASE = `${URL}/storage/v1/object/public/${BUCKET}/`
const supabase = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const cache = new Map() // valeur d'origine -> URL R2

function parseDataUrl(v){
  if(typeof v !== 'string' || !v.startsWith('data:')) return null
  const m = v.match(/^data:([^;]+);base64,(.*)$/s)
  return m ? { mime: m[1], b64: m[2] } : null
}

// Une valeur à migrer = base64 OU URL Supabase Storage
function needsMigration(v){
  return typeof v === 'string' && (v.startsWith('data:image') || v.startsWith(MEDIA_BASE))
}
function alreadyR2(v){ return typeof v === 'string' && R2_PUBLIC !== '' && v.startsWith(R2_PUBLIC) }

async function toR2(value, folder){
  const hit = cache.get(value)
  if(hit) return hit

  let buf, mime
  const dataUrl = parseDataUrl(value)
  if(dataUrl){
    buf = Buffer.from(dataUrl.b64, 'base64')
    mime = dataUrl.mime
  } else {
    const r = await fetch(value)
    if(!r.ok) throw new Error(`download ${r.status}`)
    buf = Buffer.from(await r.arrayBuffer())
    mime = (r.headers.get('content-type') || 'image/jpeg').split(';')[0]
  }
  const ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg').split('+')[0]
  const fd = new FormData()
  fd.append('file', new Blob([buf], { type: mime }), `img.${ext}`)
  fd.append('folder', folder)
  const res = await fetch(`${WORKER}/upload`, { method: 'POST', body: fd })
  if(!res.ok) throw new Error(`upload ${res.status} ${(await res.text()).slice(0, 120)}`)
  const j = await res.json()
  if(!j || !j.url) throw new Error('réponse sans url')
  cache.set(value, j.url)
  return j.url
}

async function fetchAll(table){
  const out = []
  const page = 1000
  for(let from = 0; ; from += page){
    const { data, error } = await supabase.from(table).select('*').range(from, from + page - 1)
    if(error) throw error
    out.push(...(data || []))
    if(!data || data.length < page) break
  }
  return out
}

async function migrateTable({ table, key, columns }){
  let rows = []
  try{ rows = await fetchAll(table) }
  catch(e){ console.error(`✗ ${table}: ${e.message}`); return }
  let changed = 0
  for(const row of rows){
    const patch = {}
    for(const col of columns){
      if(needsMigration(row[col]) && !alreadyR2(row[col])){
        try{
          const url = await toR2(row[col], table)
          if(url) patch[col] = url
        }catch(e){ console.error(`  ✗ ${table}[${row[key]}] ${col}: ${e.message}`) }
      }
    }
    if(Object.keys(patch).length){
      const { error } = await supabase.from(table).update(patch).eq(key, row[key])
      if(error) console.error(`  ✗ update ${table}[${row[key]}]: ${error.message}`)
      else { changed++; console.log(`  ✓ ${table}[${row[key]}] → ${Object.keys(patch).join(', ')}`) }
    }
  }
  console.log(`• ${table}: ${changed}/${rows.length} ligne(s) migrée(s) vers R2`)
}

;(async ()=>{
  console.log('▶ Migration images → Cloudflare R2')
  console.log(`  Worker: ${WORKER}`)
  console.log(`  R2    : ${R2_PUBLIC}`)
  await migrateTable({ table: 'profile_assets',  key: 'id',        columns: ['avatar', 'banner'] })
  await migrateTable({ table: 'team_assets',     key: 'team_name', columns: ['banner'] })
  await migrateTable({ table: 'teams',           key: 'id',        columns: ['logo'] })
  await migrateTable({ table: 'tournament_regs', key: 'id',        columns: ['logo'] })
  await migrateTable({ table: 'messages',        key: 'id',        columns: ['text'] })
  await migrateTable({ table: 'tournaments',     key: 'id',        columns: ['image'] })
  console.log(`✅ Terminé. ${cache.size} image(s) unique(s) uploadée(s) vers R2.`)
})().catch(e => { console.error('✗ Erreur fatale:', e.message); process.exit(1) })
