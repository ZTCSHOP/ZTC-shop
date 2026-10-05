import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Clock, ChevronRight, Send, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useIncomingSound, useSoundToggle } from '../lib/sound'

export const isImgMsg = (txt)=> typeof txt==='string' && txt.startsWith('data:image')

export default function Support(){
  const { t } = useLang()
  const { user, myThread, sendMessage, refreshAll } = useAuth()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)
  const thread = myThread()
  const [soundOn, toggleSound] = useSoundToggle()
  useIncomingSound(thread, 'admin')

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.length])

  // Polling de sécurité : nouveaux messages admin en direct même si realtime coupé
  useEffect(()=>{
    if(!user) return
    const id = setInterval(()=>{ try{ refreshAll() }catch{} }, 10000)
    return ()=>clearInterval(id)
  }, [user])

  const faqs = [
    { q: t('faq1q'), a: t('faq1a') },
    { q: t('faq2q'), a: t('faq2a') },
    { q: t('faq3q'), a: t('faq3a') },
  ]

  const handleSend = async (e)=>{
    e.preventDefault()
    if(!draft.trim() || sending) return
    setSending(true)
    try{ await sendMessage({ text: draft }); setDraft('') }catch{}
    finally{ setSending(false) }
  }

  const handleFile = (e)=>{
    const f = e.target.files?.[0]; if(!f) return
    if(!f.type.startsWith('image/')) return alert('Image uniquement')
    if(f.size > 8*1024*1024) return alert('Image trop lourde (max 8 Mo)')
    // Compression locale : max 1280px + JPEG 72% → image légère qui s'affiche partout
    const objUrl = URL.createObjectURL(f)
    const img = new Image()
    img.onload = async ()=>{
      try{
        const max = 1280
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width*scale)), h = Math.max(1, Math.round(img.height*scale))
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h
        cv.getContext('2d').drawImage(img, 0, 0, w, h)
        const url = cv.toDataURL('image/jpeg', 0.72)
        setSending(true)
        try{ await sendMessage({ text: url }) }catch{}
        finally{ setSending(false) }
      }finally{ URL.revokeObjectURL(objUrl); if(fileRef.current) fileRef.current.value='' }
    }
    img.onerror = ()=>{ URL.revokeObjectURL(objUrl); alert('Image illisible') }
    img.src = objUrl
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <div className="flex items-center gap-3 reveal">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-support-bounce">
          <MessageCircle size={26}/>
        </div>
        <div>
          <h1 className="text-2xl font-black">{t('support_title')}</h1>
          <p className="text-xs text-emerald-300 flex items-center gap-1"><Clock size={12}/> {t('sup_hours')}</p>
        </div>
        <button onClick={toggleSound} title={soundOn ? t('sound_on') : t('sound_off')} className="ml-auto p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70">
          {soundOn ? <Volume2 size={17}/> : <VolumeX size={17}/>}
        </button>
      </div>

      <div className="mt-6 rounded-3xl bg-white/5 border border-white/10 p-5">
        {!user ? (
          <div className="text-center py-8">
            <p className="text-white/60">{t('chat_login_needed')}</p>
            <Link to="/login" className="inline-block mt-4 px-6 py-3 rounded-xl bg-lime-400 text-black font-black">{t('login')}</Link>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto bg-black/20 rounded-2xl p-4 border border-white/5">
              {thread.length===0 && <p className="text-sm text-white/40 text-center py-6">{t('chat_empty')}</p>}
              {thread.map(m=>(
                <div key={m.id} className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.sender==='admin' ? 'bg-emerald-600/20 border border-emerald-500/30 mr-auto' : 'bg-lime-400 text-black ml-auto'}`}>
                  {m.sender==='admin' && <div className="text-[10px] font-black text-emerald-300">ZTC ✓</div>}
                  {isImgMsg(m.text)
                    ? <button type="button" onClick={()=>setLightbox(m.text)}><img src={m.text} alt="reçu" className="max-w-full rounded-xl max-h-64 object-contain"/></button>
                    : <div className="leading-snug">{m.text}</div>}
                  <div className="text-[10px] opacity-60 mt-0.5">{m.date ? new Date(m.date).toLocaleString([], {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}</div>
                </div>
              ))}
              <div ref={bottomRef}/>
            </div>
            <form onSubmit={handleSend} className="flex gap-2 mt-4">
              <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={t('chat_placeholder')} className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-emerald-500"/>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
              <button type="button" onClick={()=>fileRef.current?.click()} title="Envoyer une capture (reçu D17)" className="px-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 font-black flex items-center"><ImageIcon size={16}/></button>
              <button disabled={sending || !draft.trim()} className="btn-shine px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black disabled:opacity-50 flex items-center gap-2"><Send size={16}/> {t('sup_chat_tab')}</button>
            </form>
          </>
        )}
      </div>

      <h2 className="font-black mt-8 mb-3">{t('sup_faq_t')}</h2>
      <div className="grid md:grid-cols-3 gap-3">
        {faqs.map((f,i)=>(
          <details key={i} className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 group">
            <summary className="cursor-pointer font-bold text-sm flex items-center justify-between gap-2">{f.q}<ChevronRight size={14} className="shrink-0 text-white/40 group-open:rotate-90 transition"/></summary>
            <p className="text-xs text-white/60 mt-2 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
      {lightbox && (
        <div onClick={()=>setLightbox(null)} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <img src={lightbox} alt="reçu plein écran" className="max-w-full max-h-full rounded-xl object-contain"/>
        </div>
      )}
    </div>
  )
}
