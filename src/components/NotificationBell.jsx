import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Crown, Gift, Package, Shield, Trophy, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { notifAllowed } from '../lib/prefs'

const ICONS = { order:Package, tournament:Trophy, reward:Gift, wallet:Wallet, vip:Crown, team:Shield, support:Bell, info:Bell }
const COLORS = {
  order:'text-sky-300 bg-sky-500/15 border-sky-400/30',
  tournament:'text-amber-300 bg-amber-400/15 border-amber-400/30',
  reward:'text-pink-300 bg-pink-500/15 border-pink-400/30',
  wallet:'text-emerald-300 bg-emerald-500/15 border-emerald-400/30',
  vip:'text-yellow-300 bg-yellow-500/15 border-yellow-400/30',
  team:'text-violet-300 bg-violet-500/15 border-violet-400/30',
}

export function timeAgo(iso){
  if(!iso) return ''
  const d = new Date(iso)
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000))
  if(s < 60) return "à l'instant"
  if(s < 3600) return `il y a ${Math.floor(s/60)} min`
  if(s < 86400) return `il y a ${Math.floor(s/3600)} h`
  if(s < 86400 * 7) return `il y a ${Math.floor(s/86400)} j`
  return d.toLocaleDateString('fr-FR')
}

export default function NotificationBell(){
  const { user, cloud, notifications, unreadNotifications, markNotifRead, refreshNotifications, notifReady } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const { pathname } = useLocation()
  const dashboard = pathname === '/'
  const ref = useRef(null)

  useEffect(()=>{
    if(!open) return
    const onDoc = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return ()=> document.removeEventListener('mousedown', onDoc)
  }, [open])

  if(!user || !cloud) return null
  const list = (notifications || []).filter(n=> notifAllowed(n.type)).slice(0, 6)

  const go = (n)=>{
    markNotifRead(n.id)
    setOpen(false)
    if(n.link) nav(n.link)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={()=>{ setOpen(o=>!o); refreshNotifications() }} aria-label="Notifications"
        className={`relative rounded-xl border p-2.5 ${dashboard ? 'border-[#e6e8ec] bg-white text-[#343840] hover:bg-[#f6f7f8]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
        <Bell size={18}/>
        {unreadNotifications > 0 && (
          <span className={`absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 px-1 text-[10px] font-black text-black ${dashboard ? 'border-white bg-[#c89535]' : 'border-[#0a0a0c] bg-amber-400'}`}>
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[330px] rounded-2xl border border-white/15 bg-[#111218] shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wide">Notifications</span>
            {unreadNotifications>0 && <span className="text-[10px] font-bold text-amber-300">{unreadNotifications} non lue(s)</span>}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {!notifReady && (
              <p className="p-3 text-[11px] text-amber-300/90 leading-snug">Active le centre de notifications en exécutant <b>notifications-sql.txt</b> dans Supabase.</p>
            )}
            {notifReady && list.length===0 && <p className="p-4 text-xs text-white/45 text-center">Aucune notification pour le moment.</p>}
            {list.map(n=>{
              const Icon = ICONS[n.type] || Bell
              const c = COLORS[n.type] || 'text-white/70 bg-white/5 border-white/10'
              return (
                <button key={n.id} onClick={()=>go(n)} className={`w-full text-left flex gap-2.5 px-3 py-2.5 hover:bg-white/5 border-b border-white/5 ${!n.read_at ? 'bg-amber-400/[0.04]' : ''}`}>
                  <span className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${c}`}><Icon size={15}/></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold truncate">{n.title}</span>
                    {n.body && <span className="block text-[11px] text-white/50 truncate">{n.body}</span>}
                    <span className="block text-[10px] text-white/35 mt-0.5">{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"/>}
                </button>
              )
            })}
          </div>
          <Link to="/profile/notifications" onClick={()=>setOpen(false)} className="block text-center text-xs font-black text-lime-300 hover:text-lime-200 py-2.5 border-t border-white/10">
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  )
}
