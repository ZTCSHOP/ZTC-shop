import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { pushSupported, isSubscribed, subscribePush, unsubscribePush } from '../lib/push'

// Cloche activer/couper les notifications push système (téléphone + PC).
export default function PushBell({ className }){
  const { user } = useAuth()
  const { t } = useLang()
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(()=>{
    let alive = true
    if(user) isSubscribed().then(v=>{ if(alive) setOn(v) }).catch(()=>{})
    return ()=>{ alive = false }
  }, [user])

  if(!user || !pushSupported()) return null

  const toggle = async ()=>{
    setBusy(true)
    try{
      if(on){ await unsubscribePush(); setOn(false) }
      else{ await subscribePush(user.cloud ? user.id : user.id); setOn(true) }
    }catch(e){
      const m = e.message || ''
      alert(m === 'denied' ? t('notif_denied') : m === 'unsupported' ? t('notif_unsupported') : t('notif_err'))
    }finally{ setBusy(false) }
  }

  return (
    <button onClick={toggle} disabled={busy} title={on ? t('notif_disable') : t('notif_enable')}
      className={className || 'p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 disabled:opacity-50'}>
      {on ? <Bell size={17}/> : <BellOff size={17}/>}
    </button>
  )
}
