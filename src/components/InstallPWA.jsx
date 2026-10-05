import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

// Bouton flottant "Installer l'app" (PWA) — visible quand le navigateur le permet
// et que l'app n'est pas déjà installée.
export default function InstallPWA(){
  const { t } = useLang()
  const [evt, setEvt] = useState(null)
  const [hidden, setHidden] = useState(false)

  useEffect(()=>{
    if(window.matchMedia('(display-mode: standalone)').matches) return
    const onPrompt = (e)=>{ e.preventDefault(); setEvt(e) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return ()=> window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if(!evt || hidden) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xs z-50 rounded-2xl bg-[#14141c]/95 backdrop-blur border border-lime-400/30 p-3.5 shadow-2xl flex items-center gap-3">
      <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="ZTC" className="w-11 h-11 rounded-xl object-cover bg-white shrink-0"/>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-black">ZTC Shop</div>
        <div className="text-xs text-white/60">{t('pwa_install_d')}</div>
      </div>
      <button
        onClick={async ()=>{ setHidden(true); try{ await evt.prompt() }catch{} setEvt(null) }}
        className="px-3.5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-xs font-black flex items-center gap-1.5 shrink-0"
      >
        <Download size={15}/> {t('pwa_install')}
      </button>
      <button onClick={()=>setHidden(true)} aria-label="X" className="p-1.5 text-white/40 hover:text-white shrink-0">
        <X size={15}/>
      </button>
    </div>
  )
}
