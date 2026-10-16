// Affiche le meilleur nom possible pour une demande join (userName stocké souvent vide/"Joueur")
const GENERIC = /^(joueur|player|client|user)$/i
const clean = (s)=> (s||'').trim()

export const reqDisplayName = (q = {}, accounts = [])=>{
  const stored = clean(q.userName)
  if(stored && !GENERIC.test(stored)) return stored
  const acc = (accounts||[]).find(a=> a.id===q.userId)
  const accName = clean(acc?.name)
  if(accName && !GENERIC.test(accName)) return accName
  const email = clean(q.userEmail) || clean(acc?.email)
  if(email && email.includes('@')) return email.split('@')[0]
  const princ = clean(q.principal) || clean(acc?.principal)
  if(princ) return princ.length>10 ? princ.slice(0,6)+'…'+princ.slice(-4) : princ
  return (q.userId||'').slice(0,8) || '?'
}

export const reqContact = (q = {}, accounts = [])=>{
  const acc = (accounts||[]).find(a=> a.id===q.userId)
  const email = clean(q.userEmail) || clean(acc?.email)
  const phone = (acc?.phones||[])[0] || ''
  return { email, phone }
}
