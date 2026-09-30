import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Calendar, Users, Gift, ArrowRight, Plus, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

const statusStyle = {
  open: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  soon: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  done: 'bg-white/10 text-white/50 border-white/10',
  pending: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
}

export default function Tournaments(){
  const { tournaments, regsFor, saveTournament, user } = useAuth()
  const { t } = useLang()
  const [game, setGame] = useState('all')
  const [form, setForm] = useState({ title:'', game:'valorant', date:'', prize:'', max_teams:16, rules:'' })
  const [sent, setSent] = useState(false)
  const games = ['all', ...new Set(tournaments.map(x=> x.game))]
  const list = (game==='all' ? tournaments : tournaments.filter(x=> x.game===game))
    .filter(x=> x.status!=='pending')
    .slice().sort((a,b)=> new Date(a.date||0) - new Date(b.date||0))
  const mine = user ? tournaments.filter(x=> x.createdBy===user.id && x.status==='pending') : []
  const statusLabel = (s)=> s==='open' ? t('tr_open') : s==='done' ? t('tr_done') : s==='pending' ? t('tr_pending') : t('tr_soon')

  const propose = async (e)=>{
    e.preventDefault()
    if(!form.title.trim()) return
    await saveTournament({ title: form.title.trim(), game: form.game, date: form.date || null, prize: form.prize.trim(), max_teams: Number(form.max_teams)||16, entry_fee: 0, rules: form.rules.trim(), image: '' })
    setForm({ title:'', game:'valorant', date:'', prize:'', max_teams:16, rules:'' })
    setSent(true)
    setTimeout(()=>setSent(false), 4000)
  }

  const card = (tr,i)=>{
    const count = regsFor(tr.id).length
    const full = count >= (tr.max_teams||16)
    return (
      <div key={tr.id} className="anim-glow reveal" style={{animationDelay:`${(i%9)*60}ms`}}>
      <Link to={`/tournaments/${tr.id}`} className="rounded-2xl overflow-hidden bg-[#18181b] border border-white/10 hover:border-amber-500/40 transition group block">
        <div className="relative h-40 overflow-hidden">
          <img src={tr.image} alt={tr.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
          <span className={`absolute top-2 left-2 text-[11px] font-black px-2.5 py-1 rounded-full border ${statusStyle[tr.status]||statusStyle.soon}`}>{statusLabel(tr.status)}</span>
          <span className="absolute bottom-2 left-2 font-black flex items-center gap-1.5"><Trophy size={14} className="text-amber-400"/> {tr.title}</span>
        </div>
        <div className="p-4 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-white/60"><Calendar size={14}/> {tr.date ? new Date(tr.date).toLocaleString([], {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
          <div className="flex items-center gap-2 text-white/60"><Gift size={14}/> {t('tr_prize')} : <span className="text-amber-300 font-bold">{tr.prize||'—'}</span></div>
          <div className="flex items-center gap-2 text-white/60"><Users size={14}/> {count}/{tr.max_teams||16} {t('tr_slots')} • {Number(tr.entry_fee)>0 ? `${tr.entry_fee} TND` : t('tr_free')}</div>
          <div className="pt-1 flex items-center gap-1 text-amber-300 text-sm font-bold">{tr.status==='open' && !full ? <>{t('tr_register')} <ArrowRight size={15}/></> : <span className="text-white/40">{full ? t('tr_full') : statusLabel(tr.status)}</span>}</div>
        </div>
      </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1760px] mx-auto px-4 py-8">
      <div className="text-center reveal">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-black">
          <Trophy size={16}/> {t('tournaments')}
        </div>
        <p className="text-white/60 mt-3 max-w-xl mx-auto">{t('tournaments_sub')}</p>
      </div>

      <div className="mt-6 flex gap-2 overflow-auto pb-2 justify-start md:justify-center">
        {games.map(g=>(
          <button key={g} onClick={()=>setGame(g)} className={`cat-pill px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap ${game===g?'bg-amber-500 border-amber-500 text-black':'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}>
            {g==='all' ? t('all') : g}
          </button>
        ))}
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(card)}
      </div>
      {list.length===0 && <div className="text-center py-16 text-white/50">{t('no_result')}</div>}

      {/* Proposer un tournoi */}
      <div className="mt-12 rounded-3xl bg-gradient-to-b from-lime-600/15 to-transparent border border-lime-500/20 p-6">
        <h2 className="text-xl font-black flex items-center gap-2"><Plus size={18} className="text-lime-400"/> {t('tr_propose_t')}</h2>
        <p className="text-sm text-white/60 mt-1">{t('tr_propose_d')}</p>
        {!user ? (
          <Link to="/login" state={{ from: '/tournaments' }} className="inline-block mt-4 px-6 py-3 rounded-xl bg-lime-400 text-black font-black">{t('login')}</Link>
        ) : sent ? (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-2"><Check size={18}/> {t('tr_propose_ok')}</div>
        ) : (
          <form onSubmit={propose} className="mt-4 grid sm:grid-cols-2 gap-3">
            <input placeholder={t('tr_title_ph')} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-lime-500"/>
            <select value={form.game} onChange={e=>setForm({...form,game:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10">
              <option value="valorant">Valorant</option><option value="lol">LoL</option><option value="fc26">FC26</option><option value="fc27">FC27</option><option value="pubg">PUBG</option><option value="warzone">Warzone</option><option value="r6">Rainbow Six</option><option value="roblox">Roblox</option><option value="freefire">Free Fire</option><option value="other">Autres</option>
            </select>
            <input type="datetime-local" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10"/>
            <input placeholder={t('tr_prize')} value={form.prize} onChange={e=>setForm({...form,prize:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10"/>
            <input placeholder={t('tr_max')} type="number" value={form.max_teams} onChange={e=>setForm({...form,max_teams:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10"/>
            <input placeholder={t('tr_rules')} value={form.rules} onChange={e=>setForm({...form,rules:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10"/>
            <button className="btn-shine sm:col-span-2 py-3.5 rounded-xl bg-lime-600 hover:bg-lime-500 font-black">{t('tr_submit')}</button>
          </form>
        )}
        {mine.length>0 && (
          <div className="mt-4">
            <div className="text-sm font-black mb-2">{t('tr_my_proposals')}</div>
            <div className="flex flex-wrap gap-2">
              {mine.map(m=> <span key={m.id} className="text-xs px-3 py-1.5 rounded-full bg-lime-500/15 border border-lime-500/30 text-lime-300">⏳ {m.title}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
