import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { useIncomingSound, useSoundToggle } from '../lib/sound'

const isImg = (txt)=> typeof txt==='string' && txt.startsWith('data:image')

export default function ChatWidget(){
  const { user, myThread, sendMessage, refreshAll } = useAuth()
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)
  const thread = myThread()
  const hasNew = thread.length>0 && thread[thread.length-1]?.sender==='admin'
  const [soundOn, toggleSound] = useSoundToggle()
  useIncomingSound(thread, 'admin')

  useEffect(()=>{ if(open) bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [thread.length, open])
  useEffect(()=>{
    if(!open || !user) return
    const id = setInterval(()=>{ try{ refreshAll() }catch{} }, 10000)
    return ()=>clearInterval(id)
  }, [open, user])

  if(user?.isAdmin) return null

  const doSend = async (e)=>{
    e.preventDefault()
    if(!draft.trim() || sending) return
    setSending(true)
    try{ await sendMessage({ text: draft }); setDraft('') }catch{}
    finally{ setSending(false) }
  }
  const doFile = (e)=>{
    const f = e.target.files?.[0]; if(!f) return
    if(!f.type.startsWith('image/')) return alert('Image uniquement')
    if(f.size > 8*1024*1024) return alert('Image trop lourde (max 8 Mo)')
    const objUrl = URL.createObjectURL(f)
    const img = new Image()
    img.onload = async ()=>{
      try{
        const max = 1280
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width*scale)), h = Math.max(1, Math.round(img.height*scale))
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h
        cv.getContext('2d').drawImage(img, 0, 0, w, h)
        setSending(true)
        try{ await sendMessage({ text: cv.toDataURL('image/jpeg', 0.72) }) }catch{}
        finally{ setSending(false) }
      }finally{ URL.revokeObjectURL(objUrl); if(fileRef.current) fileRef.current.value='' }
    }
    img.onerror = ()=>{ URL.revokeObjectURL(objUrl); alert('Image illisible') }
    img.src = objUrl
  }

  return (
    <div className="fixed left-4 bottom-4 z-50 flex flex-col items-start gap-2">
      {open && (
        <div className="w-[320px] max-w-[85vw] rounded-2xl bg-[#141417] border border-white/15 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600">
            <span className="font-black text-sm">💬 Support ZTC</span>
            <div className="flex items-center gap-1">
              <button onClick={toggleSound} title={soundOn ? t('sound_on') : t('sound_off')} className="p-1 hover:bg-white/20 rounded-lg">
                {soundOn ? <Volume2 size={15}/> : <VolumeX size={15}/>}
              </button>
              <button onClick={()=>setOpen(false)} className="p-1 hover:bg-white/20 rounded-lg"><X size={16}/></button>
            </div>
          </div>
          <div className="p-3">
            {!user ? (
              <div className="text-center py-6">
                <p className="text-xs text-white/60">{t('chat_login_needed')}</p>
                <Link to="/login" onClick={()=>setOpen(false)} className="inline-block mt-3 px-5 py-2.5 rounded-xl bg-lime-400 text-black text-sm font-black">{t('login')}</Link>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto bg-black/20 rounded-xl p-3">
                  {thread.length===0 && <p className="text-xs text-white/40 text-center py-4">{t('chat_empty')}</p>}
                  {thread.map(m=>(
                    <div key={m.id} className={`max-w-[90%] px-2.5 py-1.5 rounded-2xl text-[13px] ${m.sender==='admin' ? 'bg-emerald-600/20 border border-emerald-500/30 mr-auto' : 'bg-lime-400 text-black ml-auto'}`}>
                      {isImg(m.text)
                        ? <img src={m.text} alt="reçu" className="max-w-full rounded-lg max-h-40 object-contain"/>
                        : <div className="leading-snug">{m.text}</div>}
                    </div>
                  ))}
                  <div ref={bottomRef}/>
                </div>
                <form onSubmit={doSend} className="flex gap-1.5 mt-2">
                  <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={t('chat_placeholder')} className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"/>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={doFile}/>
                  <button type="button" onClick={()=>fileRef.current?.click()} className="px-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 flex items-center"><ImageIcon size={15}/></button>
                  <button disabled={sending || !draft.trim()} className="px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black disabled:opacity-50 flex items-center"><Send size={15}/></button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      <button onClick={()=>setOpen(o=>!o)} title="Support"
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:brightness-110 shadow-2xl flex items-center justify-center text-white animate-support-ring">
        {open ? <X size={24}/> : <MessageCircle size={24} className="animate-support-bounce"/>}
        {hasNew && !open && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-[#0a0a0c] animate-ping"/>}
        {hasNew && !open && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-[#0a0a0c]">!</span>}
      </button>
    </div>
  )
}
