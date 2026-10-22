import { useEffect, useRef, useState } from 'react'
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

const BASE = import.meta.env.BASE_URL || '/'
const TRACKS = [
  { file: 'my musique.mp3', title: 'My Musique' },
  { file: 'Lingering_Heat.mp3', title: 'Lingering Heat' },
  { file: 'Pulse_And_Bone.mp3', title: 'Pulse And Bone' },
  { file: 'Silence_Has_Weight.mp3', title: 'Silence Has Weight' },
  { file: 'Suspended_In_This_Time.mp3', title: 'Suspended In This Time' },
]
const load = (k, d)=>{ try{ const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) }catch{ return d } }
const save = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)) }catch{} }

// Mini-lecteur flottant : playlist chiptune 100% originale (aucun copyright).
// Le son ne démarre QUE sur clic (règle navigateurs contre l'autoplay).
export default function MusicPlayer(){
  const { t } = useLang()
  const audio = useRef(null)
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [idx, setIdx] = useState(()=> load('ztc_mus_idx', 0) % TRACKS.length)
  const [vol, setVol] = useState(()=> load('ztc_mus_vol', 0.5))
  const [muted, setMuted] = useState(()=> load('ztc_mus_mute', false))

  useEffect(()=>{
    const a = new Audio()
    a.preload = 'none'
    audio.current = a
    return ()=>{ a.pause(); audio.current = null }
  }, [])

  useEffect(()=>{ save('ztc_mus_vol', vol); if(audio.current) audio.current.volume = muted ? 0 : vol }, [vol, muted])
  useEffect(()=>{ save('ztc_mus_mute', muted) }, [muted])
  useEffect(()=>{ save('ztc_mus_idx', idx) }, [idx])

  const playTrack = (i, auto=false)=>{
    const a = audio.current
    if(!a) return
    const n = (i + TRACKS.length) % TRACKS.length
    const changed = a.dataset.track !== TRACKS[n].file
    setIdx(n)
    if(changed){
      a.src = `${BASE}music/${encodeURI(TRACKS[n].file)}`
      a.dataset.track = TRACKS[n].file
    }
    a.volume = muted ? 0 : vol
    if(auto || changed || a.paused){
      a.play().then(()=> setPlaying(true)).catch(()=> setPlaying(false))
    }
  }

  useEffect(()=>{
    const a = audio.current
    if(!a) return
    const next = ()=> playTrack(idx + 1, true)
    const skip = ()=> playTrack(idx + 1, true) // fichier illisible -> piste suivante
    a.addEventListener('ended', next)
    a.addEventListener('error', skip)
    return ()=> { a.removeEventListener('ended', next); a.removeEventListener('error', skip) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, vol, muted])

  const toggle = ()=>{
    const a = audio.current
    if(!a) return
    if(playing){ a.pause(); setPlaying(false) }
    else playTrack(idx)
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[280px] max-w-[85vw] rounded-2xl bg-[#14141c]/95 backdrop-blur border border-lime-500/30 p-3.5 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-300 to-lime-500 flex items-center justify-center shrink-0">
              <Music size={18}/>
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black truncate">{TRACKS[idx].title}</div>
              <div className="text-[11px] text-white/50">ZTC Radio • {idx + 1}/{TRACKS.length}</div>
            </div>
            <button onClick={()=>setOpen(false)} className="p-1.5 text-white/40 hover:text-white"><X size={15}/></button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <button onClick={()=>playTrack(idx - 1)} title={t('mus_prev')} className="p-2.5 rounded-xl hover:bg-white/10 text-white/80"><SkipBack size={17}/></button>
            <button onClick={toggle} title={playing ? t('mus_pause') : t('mus_play')} className="w-11 h-11 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-black flex items-center justify-center">
              {playing ? <Pause size={19}/> : <Play size={19} className="ml-0.5"/>}
            </button>
            <button onClick={()=>playTrack(idx + 1)} title={t('mus_next')} className="p-2.5 rounded-xl hover:bg-white/10 text-white/80"><SkipForward size={17}/></button>
          </div>
          <div className="mt-2 space-y-1">
            {TRACKS.map((tr, i)=>(
              <button key={tr.id} onClick={()=>playTrack(i)} className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg truncate ${i===idx ? 'bg-lime-500/20 text-lime-200 font-bold' : 'text-white/60 hover:bg-white/5'}`}>
                {i===idx && playing ? '▶ ' : `${i + 1}. `}{tr.title}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={()=>setMuted(m=>!m)} className="p-1.5 text-white/60 hover:text-white">
              {muted || vol===0 ? <VolumeX size={16}/> : <Volume2 size={16}/>}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : vol}
              onChange={e=>{ const v = Number(e.target.value); setVol(v); if(v>0) setMuted(false) }}
              className="flex-1 accent-lime-400 h-1"/>
          </div>
        </div>
      )}
      <button onClick={()=>setOpen(o=>!o)}
        title="ZTC Radio"
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-lime-300 to-lime-500 hover:brightness-110 shadow-2xl flex items-center justify-center text-black">
        {playing ? (
          <span className="flex items-end gap-[3px] h-5">
            {[0, 1, 2, 3].map(i=> <span key={i} className="w-[3px] rounded-full bg-black animate-eq" style={{ animationDelay: `${i * 0.15}s`, height: '100%' }}/>)}
          </span>
        ) : <Music size={24}/>}
      </button>
    </div>
  )
}
