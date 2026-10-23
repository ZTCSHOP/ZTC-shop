import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Crown, Flame, Gamepad2, Loader2, Medal, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getChampion } from '../lib/bracket'

const TABS = [
  { key: 'season', label: 'Saison', icon: Flame },
  { key: 'games', label: 'Par jeu', icon: Gamepad2 },
  { key: 'hall', label: 'Hall of Fame', icon: Crown },
]

const GAMES = [
  { key: 'all', label: 'Tous les jeux' },
  { key: 'lol', label: 'League of Legends' },
  { key: 'valorant', label: 'Valorant' },
]

function placementPoints(tr){
  const rounds = tr.bracket || []
  const pts = new Map()
  const add = (team, p)=>{ if(team) pts.set(team, (pts.get(team)||0) + p) }
  const participants = new Set()
  rounds[0]?.matches?.forEach(m=>{ if(m.teamA) participants.add(m.teamA); if(m.teamB) participants.add(m.teamB) })
  if(!participants.size) return pts
  participants.forEach(t=> add(t, 10))
  const finalRound = rounds[rounds.length-1]
  const final = finalRound?.matches?.[0]
  if(!final?.winner) return new Map()
  add(final.winner, 100)
  const runnerUp = final.winner === final.teamA ? final.teamB : final.teamA
  add(runnerUp, 60)
  if(rounds.length >= 2){
    rounds[rounds.length-2].matches.forEach(m=>{
      if(!m.winner) return
      const loser = m.winner === m.teamA ? m.teamB : m.teamA
      if(loser && loser !== runnerUp) add(loser, 30)
    })
  }
  return pts
}

export default function Leaderboard(){
  const { user, tournaments, regs } = useAuth()
  const [tab, setTab] = useState('season')
  const [game, setGame] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    let alive = true
    if(tab !== 'season') return
    setLoading(true); setError('')
    supabase.rpc('season_leaderboard', { p_limit: 50 }).then(({ data, error: err })=>{
      if(!alive) return
      if(err){ setError(err.message || 'Erreur'); setRows([]) }
      else setRows(data || [])
    }).finally(()=>{ if(alive) setLoading(false) })
    return ()=>{ alive = false }
  }, [tab])

  const gameFilter = (tr)=> game === 'all' || tr.game === game

  const teamRanking = useMemo(()=>{
    const map = new Map()
    tournaments.filter(tr=> gameFilter(tr) && getChampion(tr.bracket)).forEach(tr=>{
      placementPoints(tr).forEach((pts, team)=>{
        const cur = map.get(team) || { team, points: 0, titles: 0, events: 0 }
        cur.points += pts
        cur.events += 1
        if(getChampion(tr.bracket) === team) cur.titles += 1
        map.set(team, cur)
      })
    })
    return [...map.values()].sort((a,b)=> b.points - a.points || b.titles - a.titles || a.team.localeCompare(b.team)).slice(0, 50)
  }, [tournaments, game])

  const hallOfFame = useMemo(()=>{
    return tournaments
      .filter(tr=> gameFilter(tr) && getChampion(tr.bracket))
      .map(tr=>{
        const champion = getChampion(tr.bracket)
        const reg = regs.find(r=> r.tournament_id === tr.id && r.team === champion)
        return { ...tr, champion, captain: reg?.captain || '', logo: reg?.logo || '' }
      })
      .sort((a,b)=> new Date(b.date||0) - new Date(a.date||0))
  }, [tournaments, regs, game])

  const captainOf = (team)=> regs.find(r=> r.team === team)?.captain || ''

  const gameLabel = (g)=> g === 'lol' ? 'League of Legends' : g === 'valorant' ? 'Valorant' : (g || 'E-Sport')

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <BarChart3 size={20} className="text-lime-300"/>
        </div>
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">Classements ZTC</h1>
          <p className="text-sm text-white/50">La saison, les meilleures équipes par jeu et le Hall of Fame des champions.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {TABS.map(t=>{
          const Icon = t.icon
          return (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black border transition ${tab===t.key ? 'bg-amber-400 text-black border-amber-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
              <Icon size={15}/> {t.label}
            </button>
          )
        })}
      </div>

      {tab !== 'season' && (
        <div className="flex flex-wrap gap-2 mb-4">
          {GAMES.map(g=>(
            <button key={g.key} onClick={()=>setGame(g.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${game===g.key ? 'border-amber-400/50 bg-amber-400/10 text-amber-200' : 'border-white/10 text-white/50 hover:text-white'}`}>
              {g.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'season' && (
        <div className="rounded-3xl border border-white/10 bg-[#0b0c12]/70 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="font-black flex items-center gap-2"><Flame size={17} className="text-amber-300"/> Saison en cours</h2>
              <p className="text-xs text-white/45 mt-0.5">XP gagné depuis le début de la saison (hors XP historique).</p>
            </div>
            {loading && <Loader2 size={16} className="animate-spin text-white/40"/>}
          </div>
          {error ? (
            <div className="p-5 text-sm text-amber-200">
              Classement indisponible. Exécute <code className="px-1.5 py-0.5 rounded bg-black/40">sprint2-sql.txt</code> dans Supabase.
            </div>
          ) : rows.length === 0 && !loading ? (
            <div className="p-8 text-center text-sm text-white/45">Pas encore de XP cette saison. Sois le premier à marquer !</div>
          ) : (
            <div className="divide-y divide-white/5">
              {rows.map((r, i)=>(
                <div key={r.user_id} className={`flex items-center gap-3 px-4 py-3 ${r.user_id===user?.id ? 'bg-amber-400/[0.07]' : ''}`}>
                  <span className={`w-8 text-center font-black ${i<3 ? 'text-amber-300' : 'text-white/40'}`}>{i < 3 ? <Medal size={17} className="mx-auto"/> : r.rank}</span>
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-black text-sm shrink-0">{(r.name||'?')[0].toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    {r.user_id ? <Link to={`/player/${r.user_id}`} className="font-bold truncate hover:text-amber-200">{r.name}</Link> : <span className="font-bold truncate">{r.name}</span>}
                    {r.user_id===user?.id && <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-black">TOI</span>}
                  </div>
                  <span className="font-black text-amber-300 whitespace-nowrap">{Number(r.xp).toLocaleString('fr-FR')} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'games' && (
        <div className="grid gap-3">
          {teamRanking.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0b0c12]/70 p-8 text-center text-sm text-white/45">
              Aucun tournoi terminé pour ce jeu. Le classement se remplit dès qu’un bracket a un champion.
            </div>
          ) : teamRanking.map((t, i)=>(
            <div key={t.team} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0c12]/70 px-4 py-3">
              <span className={`w-8 text-center font-black ${i<3 ? 'text-amber-300' : 'text-white/40'}`}>{i < 3 ? <Medal size={17} className="mx-auto"/> : i+1}</span>
              <div className="min-w-0 flex-1">
                <div className="font-black truncate flex items-center gap-2">{t.team} {t.titles>0 && <Crown size={14} className="text-amber-300"/>}</div>
                <div className="text-[11px] text-white/45 truncate">{captainOf(t.team) ? `Capitaine : ${captainOf(t.team)} • ` : ''}{t.events} tournoi{t.events>1?'s':''} • {t.titles} titre{t.titles>1?'s':''}</div>
              </div>
              <span className="font-black text-amber-300 whitespace-nowrap">{t.points} pts</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'hall' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {hallOfFame.length === 0 ? (
            <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-[#0b0c12]/70 p-8 text-center text-sm text-white/45">
              Le Hall of Fame s’ouvrira au premier tournoi terminé. Reste connecté.
            </div>
          ) : hallOfFame.map(tr=>(
            <Link key={tr.id} to={`/tournaments/${tr.id}`} className="group relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/[0.12] via-[#0b0c12]/85 to-[#0b0c12] p-5 hover:border-amber-300/60 transition">
              <Trophy className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-400/10" strokeWidth={1.2}/>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-300/80">{gameLabel(tr.game)}</div>
              <div className="mt-1 font-display text-xl font-bold uppercase tracking-wide group-hover:text-amber-200">{tr.title}</div>
              <div className="mt-4 text-xs text-white/45">Champion</div>
              <div className="font-black text-lg flex items-center gap-2"><Crown size={17} className="text-amber-300"/> {tr.champion}</div>
              {tr.captain && <div className="text-xs text-white/50 mt-0.5">Capitaine : {tr.captain}</div>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/40">
                {tr.date && <span>{new Date(tr.date).toLocaleDateString('fr-FR')}</span>}
                {tr.prize && <span>🏆 {tr.prize}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
