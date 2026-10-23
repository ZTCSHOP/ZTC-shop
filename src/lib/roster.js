// Effectifs e-sport : 5 titulaires + 2 remplaçants
export const ROSTER_MIN = 5
export const ROSTER_MAX = 7

export const GAME_ROLES = {
  lol: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
  valorant: ['Duelliste', 'Initiateur', 'Contrôleur', 'Sentinelle', 'Flex'],
}

export const rolesFor = (game)=> GAME_ROLES[game] || GAME_ROLES.valorant

export const blankRoster = (game)=>{
  const roles = rolesFor(game)
  return [
    ...roles.map(role=> ({ name: '', riot: '', role, sub: false })),
    { name: '', riot: '', role: 'Remplaçant 1', sub: true },
    { name: '', riot: '', role: 'Remplaçant 2', sub: true },
  ]
}

export const normalizeRoster = (roster, game)=>{
  const base = blankRoster(game)
  if(!Array.isArray(roster)) return base
  return base.map((slot, i)=>{
    const cur = roster[i] || {}
    return {
      ...slot,
      name: typeof cur.name === 'string' ? cur.name.slice(0, 40) : '',
      riot: typeof cur.riot === 'string' ? cur.riot.slice(0, 60) : '',
      sub: !!slot.sub,
    }
  })
}

export const filledStarters = (roster)=> (Array.isArray(roster) ? roster : [])
  .filter(p=> !p?.sub && (p?.name || '').trim()).length

export const rosterStatus = (roster, game)=>{
  const normalized = normalizeRoster(roster, game)
  const filled = normalized.filter(p=> (p.name || '').trim()).length
  const starters = filledStarters(normalized)
  return {
    roster: normalized,
    filled,
    starters,
    complete: starters >= ROSTER_MIN,
    label: `${starters}/${ROSTER_MIN}`,
  }
}

export const cleanRoster = (roster, game)=> normalizeRoster(roster, game)
  .map(p=> ({ name: (p.name||'').trim(), riot: (p.riot||'').trim(), role: p.role, sub: !!p.sub }))
