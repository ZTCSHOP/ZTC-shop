// Extrait l'ID YouTube (watch, youtu.be, shorts, embed, live ou ID brut) — null si invalide
export const ytId = (url)=>{
  if(!url) return null
  const s = String(url).trim()
  if(/^[A-Za-z0-9_-]{11}$/.test(s)) return s
  const m = s.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}
