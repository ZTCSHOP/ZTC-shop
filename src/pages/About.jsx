import { Link } from 'react-router-dom'
import { Gamepad2, Zap, ShieldCheck, Truck, Clock, Languages, ArrowRight, MessageCircle } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

export default function About(){
  const { t } = useLang()
  const stats = [
    { icon: <Gamepad2 size={18} className="text-lime-400"/>, v: '12+', l: t('st_games') },
    { icon: <Clock size={18} className="text-amber-400"/>, v: '< 2 min', l: t('st_delivery') },
    { icon: <Truck size={18} className="text-emerald-400"/>, v: '×2', l: t('st_pay') },
    { icon: <Languages size={18} className="text-lime-400"/>, v: 'FR/EN/AR', l: t('st_lang') },
  ]
  const dos = [
    { title: t('do1t'), desc: t('do1d') },
    { title: t('do2t'), desc: t('do2d') },
    { title: t('do3t'), desc: t('do3d') },
  ]
  const steps = [
    { n: '1', title: t('step1t'), desc: t('step1d') },
    { n: '2', title: t('step2t'), desc: t('step2d') },
    { n: '3', title: t('step3t'), desc: t('step3d') },
  ]
  const trust = [
    { title: t('trust1t'), desc: t('trust1d') },
    { title: t('trust2t'), desc: t('trust2d') },
    { title: t('trust3t'), desc: t('trust3d') },
  ]
  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10">
      <div className="text-center reveal">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-lime-400/15 border border-lime-400/30 text-xs text-lime-300 mb-4">
          <Zap size={14}/> ZTC-GAMING • ZOMRA TN
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">{t('about_title')}</h1>
        <p className="text-white/60 mt-3 max-w-2xl mx-auto">{t('about_sub')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
        {stats.map((s,i)=>(
          <div key={i} className="reveal rounded-2xl bg-white/5 border border-white/10 p-4 text-center" style={{animationDelay:`${i*70}ms`}}>
            <div className="flex justify-center">{s.icon}</div>
            <div className="text-2xl font-black mt-1">{s.v}</div>
            <div className="text-xs text-white/50">{s.l}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-black mt-10 mb-4">{t('about_do_t')}</h2>
      <div className="grid md:grid-cols-3 gap-3">
        {dos.map((d,i)=>(
          <div key={i} className="rounded-2xl p-5 bg-white/[0.04] border border-white/10">
            <div className="font-bold">{d.title}</div>
            <div className="text-sm text-white/60 mt-1 leading-relaxed">{d.desc}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-black mt-10 mb-4">{t('about_how_t')}</h2>
      <div className="grid md:grid-cols-3 gap-3">
        {steps.map((s,i)=>(
          <div key={i} className="rounded-2xl p-5 bg-gradient-to-b from-lime-400/15 to-transparent border border-lime-400/20">
            <div className="w-9 h-9 rounded-xl bg-lime-400 text-black flex items-center justify-center font-black">{s.n}</div>
            <div className="font-bold mt-3">{s.title}</div>
            <div className="text-sm text-white/60 mt-1 leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-black mt-10 mb-4 flex items-center gap-2"><ShieldCheck size={20} className="text-emerald-400"/> ZTC</h2>
      <div className="grid md:grid-cols-3 gap-3">
        {trust.map((f,i)=>(
          <div key={i} className="rounded-2xl p-5 bg-white/[0.04] border border-white/10">
            <div className="font-bold">{f.title}</div>
            <div className="text-sm text-white/60 mt-1">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-10">
        <Link to="/catalog" className="btn-shine px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black flex items-center gap-2">{t('browse')} <ArrowRight size={18}/></Link>
        <Link to="/support" className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold flex items-center gap-2"><MessageCircle size={18}/> {t('support')}</Link>
      </div>
    </div>
  )
}
