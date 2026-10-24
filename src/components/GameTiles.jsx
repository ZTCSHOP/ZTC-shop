import { Check } from 'lucide-react'
import { GAMES } from '../lib/games'

export default function GameTiles({ selected = [], onToggle, disabled = false }){
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {GAMES.filter(game=> ['lol','valorant','cs2','r6','fortnite','ea_fc','efootball','brawlhalla','rocket_league','cod','overwatch2','apex'].includes(game.id)).map(game=>{
        const active = selected.includes(game.id)
        return (
          <button
            key={game.id}
            type="button"
            onClick={()=> onToggle?.(game.id)}
            disabled={!onToggle || disabled}
            aria-pressed={active}
            className={`group relative aspect-[1.08] overflow-hidden rounded-xl border text-left transition duration-200 ${active ? 'border-violet-300 ring-2 ring-violet-400/50' : 'border-white/10 hover:border-white/35'} ${!onToggle ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${game.tint} via-[#10182b] to-[#080d18]`}/>
            {game.image && <img
              src={game.image}
              alt=""
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${game.id==='valorant' ? 'object-[50%_25%] opacity-65' : 'opacity-65 group-hover:scale-105'}`}
              onError={e=>{ e.currentTarget.style.display = 'none' }}
            />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10"/>
            <div className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-1">
              <span className="text-[10px] font-black uppercase tracking-wide text-white drop-shadow sm:text-xs">{game.short}</span>
              <span className="text-lg drop-shadow" aria-hidden="true">{game.icon}</span>
            </div>
            {active && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg"><Check size={14}/></span>}
          </button>
        )
      })}
    </div>
  )
}
