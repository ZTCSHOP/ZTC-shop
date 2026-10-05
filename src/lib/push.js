import { supabase, isCloudEnabled } from './supabase'

// Clé publique VAPID (NON secrète par design) — surchargeable via env.
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BKgnrSdApFyLHzEynp6GQEYfHsbKxewjjVPl8xTMYTh4VPtDUq4-9vGCV-H0EQgwXZ71eAZy_ZJ28iIz7kV9zG8'

export const pushSupported = () =>
  typeof window !== 'undefined' &&
  ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window)

function b64ToU8(s){
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const b = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...b].map(c=> c.charCodeAt(0)))
}
function bufToB64(buf){
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function readyReg(){
  return await navigator.serviceWorker.ready
}

export async function isSubscribed(){
  try{
    const reg = await readyReg()
    return !!(await reg.pushManager.getSubscription())
  }catch{ return false }
}

export async function subscribePush(userId){
  if(!pushSupported()) throw new Error('unsupported')
  if(!('Notification' in window)) throw new Error('unsupported')
  if(Notification.permission === 'denied') throw new Error('denied')
  if(Notification.permission !== 'granted'){
    const p = await Notification.requestPermission()
    if(p !== 'granted') throw new Error('denied')
  }
  const reg = await readyReg()
  let sub = await reg.pushManager.getSubscription()
  if(!sub){
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(VAPID_PUBLIC) })
  }
  const j = sub.toJSON()
  if(isCloudEnabled && userId){
    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint: sub.endpoint, user_id: userId,
      p256dh: j.keys.p256dh, auth: j.keys.auth,
      ua: (navigator.userAgent || '').slice(0, 200),
    }, { onConflict: 'endpoint' })
    if(error) throw error
  }
  return true
}

export async function unsubscribePush(){
  try{
    const reg = await readyReg()
    const sub = await reg.pushManager.getSubscription()
    if(sub){
      const ep = sub.endpoint
      try{ await sub.unsubscribe() }catch{}
      if(isCloudEnabled){
        try{ await supabase.from('push_subscriptions').delete().eq('endpoint', ep) }catch{}
      }
    }
  }catch{}
}
