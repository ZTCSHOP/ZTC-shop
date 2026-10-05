import { useEffect, useRef, useState } from 'react'

const KEY = 'ztc_sound'
const URL = `${import.meta.env.BASE_URL}sounds/pop.wav`

export const isSoundOn = ()=>{
  try{ return localStorage.getItem(KEY) !== 'off' }catch{ return true }
}
export const setSoundOn = (on)=>{
  try{ localStorage.setItem(KEY, on ? 'on' : 'off') }catch{}
}

// Les navigateurs bloquent l'audio avant un geste utilisateur :
// on débloque au premier clic/touche, une seule fois.
let unlocked = false
function unlock(){
  if(unlocked) return
  unlocked = true
  try{
    const a = new Audio(URL)
    a.volume = 0
    a.play().catch(()=>{}).finally(()=>{ try{ a.pause() }catch{} })
  }catch{}
}
if(typeof window !== 'undefined'){
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}

export function playPop(){
  if(!isSoundOn()) return
  try{
    const a = new Audio(URL)
    a.volume = 0.6
    a.play().catch(()=>{})
  }catch{}
}

// Joue un "pop" quand un NOUVEAU message de l'autre partie arrive.
// (l'historique existant au chargement ne déclenche rien)
export function useIncomingSound(list, fromSender){
  const lastId = useRef(null)
  const init = useRef(false)
  useEffect(()=>{
    if(!Array.isArray(list) || !list.length) return
    const last = list[list.length - 1]
    if(!init.current){ init.current = true; lastId.current = last.id; return }
    if(last.id !== lastId.current){
      lastId.current = last.id
      if(last.sender === fromSender) playPop()
    }
  }, [list, fromSender])
}

// Bouton muet/activé (état local synchronisé avec localStorage)
export function useSoundToggle(){
  const [on, setOn] = useState(isSoundOn())
  const toggle = ()=>{ const v = !on; setOn(v); setSoundOn(v); if(v) playPop() }
  return [on, toggle]
}
