// ============================================================
//  ZTC Shop — Migration des images base64 → Supabase Storage
//  Usage (PowerShell) :
//     $env:SUPABASE_SERVICE_ROLE_KEY="<ta cle service_role>"
//     node scripts/migrate-images.mjs
//  (ou mets SUPABASE_SERVICE_ROLE_KEY=... dans .env)
//  Nécessite : @supabase/supabase-js (déjà installé)
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

if(!URL || !KEY){
  console.error('✗ Manque SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY.')
  console.error('  → Ajoute SUPABASE_SERVICE_ROLE_KEY=... dans .env, ou passe-le en variable d\'environnement.')
  process.exit(1)
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const cache = new Map() // dataURL -> publicUrl (déduplication)

function parseDataUrl(v){
  if(typeof v !== 'string' || !v.startsWith('data:')) return null
  const m = v.match(/^data:([^;]+);base64,(.*)$/s)
  return m ? { mime: m[1], b64: m[2] } : null
}
function extFor(mime){ return (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg').split('+')[0] }

async function upload(dataUrl, folder){
  if(cache.has(dataUrl)) return cache.get(dataUrl)
  const parsed = parseDataUrl(dataUrl)
  if(!parsed) return null
  const buf = Buffer.from(parsed.b64, 'base64')
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFor(parsed.mime)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: parsed.mime, cacheControl: '31536000', upsert: false,
  })
  if(error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  cache.set(dataUrl, data.publicUrl)
  return data.publicUrl
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
      if(parseDataUrl(row[col])){
        try{
          const url = await upload(row[col], table)
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
  console.log(`• ${table}: ${changed}/${rows.length} ligne(s) migrée(s)`)
}

async function ensureBucket(){
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if(error){ console.warn('listBuckets:', error.message); return }
  if(!buckets.find(b => b.id === BUCKET)){
    const { error: ce } = await supabase.storage.createBucket(BUCKET, { public: true })
    if(ce) console.warn('createBucket:', ce.message)
    else console.log(`✓ bucket "${BUCKET}" créé (public)`)
  } else {
    console.log(`✓ bucket "${BUCKET}" déjà présent`)
  }
}

;(async ()=>{
  console.log('▶ Migration images base64 → Supabase Storage')
  await ensureBucket()
  await migrateTable({ table: 'profile_assets',  key: 'id',        columns: ['avatar', 'banner'] })
  await migrateTable({ table: 'team_assets',     key: 'team_name', columns: ['banner'] })
  await migrateTable({ table: 'teams',           key: 'id',        columns: ['logo'] })
  await migrateTable({ table: 'tournament_regs', key: 'id',        columns: ['logo'] })
  await migrateTable({ table: 'messages',        key: 'id',        columns: ['text'] })
  await migrateTable({ table: 'tournaments',     key: 'id',        columns: ['image'] })
  console.log(`✅ Terminé. ${cache.size} image(s) unique(s) uploadée(s).`)
})().catch(e => { console.error('✗ Erreur fatale:', e.message); process.exit(1) })
