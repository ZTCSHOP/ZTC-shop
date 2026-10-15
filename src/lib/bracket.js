// Bracket élimination directe + scores + classement (pur, testable)
export function nextPow2(n){ let p = 1; while(p < n) p *= 2; return p }

export function buildRounds(size){
  const rounds = []
  let n = size, r = 0
  while(n >= 2){
    const matches = []
    for(let i = 0; i < n / 2; i++) matches.push({ id: `r${r}m${i}`, teamA: null, teamB: null, scoreA: null, scoreB: null, winner: null })
    rounds.push({ round: r, matches })
    n /= 2; r++
  }
  return rounds
}

export function shuffleArr(arr){
  const a = [...arr]
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// Fait descendre les vainqueurs décidés vers le tour suivant
export function propagate(rounds){
  for(let r = 0; r < rounds.length - 1; r++){
    rounds[r].matches.forEach((m, i)=>{
      if(!m.winner) return
      const nm = rounds[r + 1].matches[Math.floor(i / 2)]
      if(!nm) return
      if(i % 2 === 0) nm.teamA = m.winner
      else nm.teamB = m.winner
    })
  }
  return rounds
}

export function generateBracket(teamNames, shuffle = true){
  const teams = [...new Set((teamNames || []).filter(Boolean))]
  if(teams.length < 2) throw new Error('teams')
  const list = shuffle ? shuffleArr(teams) : teams
  const size = nextPow2(list.length)
  const rounds = buildRounds(size)
  for(let i = 0; i < size; i += 2){
    const a = list[i] || null, b = list[i + 1] || null
    const m = rounds[0].matches[i / 2]
    m.teamA = a; m.teamB = b
    if(a && !b) m.winner = a
    else if(b && !a) m.winner = b
  }
  return propagate(rounds)
}

// Enregistre un score ; égalité interdite ; écrase l'aval puis re-propage
export function setResult(rounds, r, i, scoreA, scoreB){
  const sa = Number(scoreA), sb = Number(scoreB)
  if(!Number.isFinite(sa) || !Number.isFinite(sb)) return { error: 'score' }
  if(sa === sb) return { error: 'draw' }
  const copy = JSON.parse(JSON.stringify(rounds))
  const m = copy[r]?.matches[i]
  if(!m || !m.teamA || !m.teamB) return { error: 'teams' }
  m.scoreA = sa; m.scoreB = sb
  m.winner = sa > sb ? m.teamA : m.teamB
  for(let rr = r + 1; rr < copy.length; rr++){
    copy[rr].matches.forEach(x=>{ x.teamA = null; x.teamB = null; x.scoreA = null; x.scoreB = null; x.winner = null })
  }
  propagate(copy)
  return { rounds: copy }
}

export function getChampion(rounds){
  if(!rounds?.length) return null
  return rounds[rounds.length - 1].matches[0]?.winner || null
}

// Classement : victoire = 3 pts
export function computeStandings(rounds){
  const map = new Map()
  const bump = (team, win)=>{
    if(!team) return
    if(!map.has(team)) map.set(team, { team, w: 0, l: 0 })
    const s = map.get(team)
    if(win) s.w += 1; else s.l += 1
  }
  ;(rounds || []).forEach(rd=> rd.matches.forEach(m=>{
    if(m.winner && m.teamA && m.teamB){
      bump(m.winner, true)
      bump(m.winner === m.teamA ? m.teamB : m.teamA, false)
    }
  }))
  return [...map.values()]
    .map(s=> ({ ...s, pts: s.w * 3 }))
    .sort((a, b)=> b.pts - a.pts || b.w - a.w)
}

// Tri d'affichage des tournois : open d'abord (date la plus proche),
// puis soon/pending, done en bas (les plus récents d'abord)
export function sortTournaments(arr){
  const grp = (t)=> t?.status==='done' ? 2 : t?.status==='open' ? 0 : 1
  const dd = (t)=> { const v = t?.date ? new Date(t.date).getTime() : NaN; return isNaN(v) ? null : v }
  return [...(arr||[])].sort((a,b)=>{
    const ga = grp(a), gb = grp(b)
    if(ga!==gb) return ga-gb
    const da = dd(a), db = dd(b)
    if(da===null && db===null) return 0
    if(da===null) return 1
    if(db===null) return -1
    return ga===2 ? db-da : da-db
  })
}
