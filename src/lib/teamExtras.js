// Extras équipe stockés localement (localisation/site/about) en attendant la migration cloud.
// Clé = nom d'équipe normalisé.
const KEY = 'ztc_team_extras'
const norm = (n)=> (n||'').trim().toLowerCase()
const readAll = ()=> { try { return JSON.parse(localStorage.getItem(KEY)||'{}') } catch { return {} } }

export const getTeamExtras = (name)=> readAll()[norm(name)] || {}
export const setTeamExtras = (name, patch)=>{
  const all = readAll()
  all[norm(name)] = { ...(all[norm(name)]||{}), ...patch }
  try{ localStorage.setItem(KEY, JSON.stringify(all)) }catch{}
  window.dispatchEvent(new CustomEvent('ztc:team-extras', { detail: norm(name) }))
  return all[norm(name)]
}
export const renameTeamExtras = (oldName, newName)=>{
  const all = readAll()
  const oldKey = norm(oldName)
  const newKey = norm(newName)
  if(oldKey && newKey && oldKey!==newKey){
    all[newKey] = { ...(all[oldKey]||{}), ...(all[newKey]||{}) }
    delete all[oldKey]
    try{ localStorage.setItem(KEY, JSON.stringify(all)) }catch{}
    window.dispatchEvent(new CustomEvent('ztc:team-extras', { detail: newKey }))
  }
  return all[newKey] || {}
}
