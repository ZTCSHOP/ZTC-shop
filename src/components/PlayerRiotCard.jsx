import { Gamepad2, Trophy, Swords, Crosshair, Target, Loader2 } from 'lucide-react'
import { imgUrl } from '../lib/riot'

export default function PlayerRiotCard({ riot, stats, loading, error }){
  if(!riot) return null
  const isValo = riot.game === 'valorant'

  return (
    <div id="riot" className="mt-6 rounded-3xl bg-gradient-to-br from-sky-500/10 to-indigo-500/5 border border-sky-500/20 p-5 scroll-mt-24">
      <div className="flex items-center gap-2">
        <h2 className="font-black flex items-center gap-2"><Gamepad2 size={17} className="text-sky-300"/> Compte Riot</h2>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-sky-200/70 border border-sky-500/30 rounded-full px-2 py-0.5">
          {isValo ? 'Valorant' : 'League of Legends'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {stats?.icon
          ? <img src={imgUrl(stats.icon)} alt="" loading="lazy" decoding="async" className="w-12 h-12 rounded-2xl object-cover border border-white/10"/>
          : <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-xl">{isValo ? '🎯' : '⚔️'}</div>}
        <div className="min-w-0">
          <div className="font-black truncate">{riot.name}<span className="text-white/40">#{riot.tag}</span></div>
          <div className="text-[11px] text-white/50">
            {String(riot.region || '').toUpperCase()}
            {stats?.level ? ` • Nv.${stats.level}` : ''}
          </div>
        </div>
        {loading && <Loader2 size={15} className="ml-auto animate-spin text-white/40"/>}
      </div>

      {error && <div className="mt-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{error}</div>}

      {stats && (
        <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 p-4">
          <div className="text-[11px] font-bold text-white/60 flex items-center gap-1.5"><Gamepad2 size={13}/> Playstyle <span className="text-white/35 font-normal">· last 90 days</span></div>

          <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
            <div className="text-[11px] font-bold text-white/60">Rang</div>
            {isValo ? (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  {stats.ranked?.image
                    ? <img src={imgUrl(stats.ranked.image)} alt="" loading="lazy" decoding="async" className="w-11 h-11 object-contain"/>
                    : <div className="w-11 h-11 rounded-lg bg-white/5"/>}
                  <div>
                    <div className="text-[10px] text-white/40">Actuel</div>
                    <div className="font-bold text-sm leading-tight">{stats.ranked?.tier || 'Unranked'}</div>
                    {stats.ranked && <div className="text-[10px] text-sky-300">{stats.ranked.rr} RR</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {(stats.peak90?.image || stats.ranked?.image)
                    ? <img src={imgUrl(stats.peak90?.image || stats.ranked.image)} alt="" loading="lazy" decoding="async" className="w-11 h-11 object-contain"/>
                    : <div className="w-11 h-11 rounded-lg bg-white/5"/>}
                  <div>
                    <div className="text-[10px] text-white/40">Peak (90j)</div>
                    <div className="font-bold text-sm leading-tight">{stats.peak90?.tier || stats.ranked?.peakAllTime || '—'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                {stats.ranked?.emblem
                  ? <img src={imgUrl(stats.ranked.emblem)} alt="" loading="lazy" decoding="async" className="w-12 h-12 object-contain"/>
                  : <div className="w-12 h-12 rounded-lg bg-white/5"/>}
                <div>
                  <div className="font-bold text-sm">{stats.ranked ? `${stats.ranked.tier} ${stats.ranked.division}` : 'Unranked'}</div>
                  {stats.ranked && <div className="text-[11px] text-sky-300">{stats.ranked.lp} LP · {stats.ranked.winrate}% WR</div>}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
            <div className="text-[11px] font-bold text-white/60">{isValo ? 'Agents les plus joués' : 'Champions les plus joués'}</div>
            {(isValo ? stats.agents : stats.champions)?.length
              ? <div className="mt-2 grid grid-cols-4 gap-2">
                  {(isValo ? stats.agents : stats.champions).map(a=>(
                    <div key={a.name || a.id} className="relative rounded-lg overflow-hidden bg-white/5 border border-white/10">
                      {a.icon && <img src={imgUrl(a.icon)} alt={a.name || ''} loading="lazy" decoding="async" className="w-full aspect-square object-cover"/>}
                      <span className="absolute bottom-1 left-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-pink-500 text-white">{a.pct}%</span>
                    </div>
                  ))}
                </div>
              : <div className="text-[11px] text-white/40 mt-1">—</div>}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
            {isValo ? (
              <>
                <div className="flex items-center gap-2"><Crosshair size={16} className="text-red-400 shrink-0"/><div><div className="font-black text-sm leading-tight">{stats.stats?.kd ?? '—'}</div><div className="text-[10px] text-white/40">K/D ratio</div></div></div>
                <div className="flex items-center gap-2"><Target size={16} className="text-sky-400 shrink-0"/><div><div className="font-black text-sm leading-tight">{stats.stats?.hs ?? '—'}%</div><div className="text-[10px] text-white/40">Headshot</div></div></div>
                <div className="flex items-center gap-2"><Swords size={16} className="text-pink-400 shrink-0"/><div><div className="font-black text-sm leading-tight">{stats.stats?.matches ?? '—'}</div><div className="text-[10px] text-white/40">Matchs</div></div></div>
                <div className="flex items-center gap-2"><Trophy size={16} className="text-amber-300 shrink-0"/><div><div className="font-black text-sm leading-tight">{stats.stats?.winrate ?? '—'}%</div><div className="text-[10px] text-white/40">Winrate</div></div></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2"><Trophy size={16} className="text-amber-300 shrink-0"/><div><div className="font-black text-sm leading-tight">{stats.ranked?.wins ?? '—'}</div><div className="text-[10px] text-white/40">Wins</div></div></div>
                <div className="flex items-center gap-2"><Swords size={16} className="text-pink-400 shrink-0"/><div><div className="font-black text-sm leading-tight">{stats.ranked ? `${stats.ranked.wins + stats.ranked.losses}` : '—'}</div><div className="text-[10px] text-white/40">Parties classées</div></div></div>
                <div className="flex items-center gap-2"><Target size={16} className="text-sky-400 shrink-0"/><div><div className="font-black text-sm leading-tight">{stats.ranked?.winrate ?? '—'}%</div><div className="text-[10px] text-white/40">Winrate</div></div></div>
                <div className="flex items-center gap-2"><Crosshair size={16} className="text-emerald-400 shrink-0"/><div><div className="font-black text-sm leading-tight">{stats.ranked?.losses ?? '—'}</div><div className="text-[10px] text-white/40">Losses</div></div></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
