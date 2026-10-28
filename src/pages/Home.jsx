import { Link } from 'react-router-dom'
import {
  ArrowRight, Bell, CalendarDays, ChevronRight, Clock3, Crown, Gamepad2, Gift,
  MapPin, Medal, ShoppingBag, Trophy, Users, Wallet,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { GAMES, gameMeta } from '../lib/games'
import { levelProgress, xpForActivity } from '../lib/level'

const featuredGames = ['valorant', 'lol', 'cs2', 'r6', 'fc27', 'tekken8']

const dateLabel = (date, lang) => {
  if (!date) return lang === 'ar' ? 'قريباً' : 'À confirmer'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return lang === 'ar' ? 'قريباً' : 'À confirmer'
  return parsed.toLocaleString(lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-TN' : 'fr-TN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function Home(){
  const { lang } = useLang()
  const { user, tournaments, regsFor, myOrders, myRegs, myTeams, isVipActive, unreadNotifications } = useAuth()
  const labels = lang === 'ar'
    ? { home:'الرئيسية', tournaments:'البطولات', teams:'الفرق', players:'اللاعبون', store:'المتجر', wallet:'المحفظة', rewards:'المكافآت', games:'ألعابنا', ongoing:'البطولات الحالية', seeAll:'عرض الكل', nextEvents:'البطولات القادمة', activity:'آخر نشاط', profile:'ملفي الشخصي', level:'المستوى', xp:'نقاط الخبرة', signIn:'سجّل الدخول', join:'اكتشف البطولة', free:'مجاني', online:'أونلاين', empty:'لا توجد بطولات قادمة حالياً', noActivity:'ستظهر طلباتك الأخيرة هنا.', community:'مجتمع ZTC', play:'العب. نافس. اربح.' }
    : lang === 'en'
      ? { home:'Home', tournaments:'Tournaments', teams:'Teams', players:'Players', store:'Store', wallet:'Wallet', rewards:'Rewards', games:'Our games', ongoing:'Live tournaments', seeAll:'See all', nextEvents:'Upcoming events', activity:'Recent activity', profile:'My profile', level:'Level', xp:'XP', signIn:'Sign in', join:'View tournament', free:'Free', online:'Online', empty:'No upcoming tournaments right now', noActivity:'Your recent orders will appear here.', community:'ZTC COMMUNITY', play:'Play. Compete. Win.' }
      : { home:'Accueil', tournaments:'Tournois', teams:'Équipes', players:'Joueurs', store:'Boutique', wallet:'Portefeuille', rewards:'Récompenses', games:'Nos jeux', ongoing:'Tournois en cours', seeAll:'Voir tout', nextEvents:'Prochains événements', activity:'Activité récente', profile:'Mon profil', level:'Niveau', xp:'XP', signIn:'Connexion', join:'Voir le tournoi', free:'Gratuit', online:'En ligne', empty:'Aucun tournoi à venir pour le moment', noActivity:'Tes dernières commandes apparaîtront ici.', community:'COMMUNAUTÉ ZTC', play:'Joue. Compétitionne. Gagne.' }

  const allTournaments = [...(tournaments || [])].filter(item => item.status !== 'pending' && item.status !== 'done')
  const upcoming = allTournaments
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    .slice(0, 4)
  const featured = upcoming[0]
  const userOrders = user ? myOrders() : []
  const registrations = user ? myRegs() : []
  const teams = user ? myTeams() : []
  const teamCount = new Set([...teams.map(team => team.name), ...registrations.map(reg => reg.team)].filter(Boolean)).size
  const xp = user ? (user.xp != null ? Number(user.xp) : xpForActivity({ orders: userOrders.length, regs: registrations.length, teams: teams.length })) : 0
  const { level, cur, need } = levelProgress(xp)
  const progress = need > 0 ? Math.min(100, Math.round(cur / need * 100)) : 0
  const activeOrders = userOrders.slice(0, 3)
  const games = featuredGames.map(id => GAMES.find(game => game.id === id)).filter(Boolean)

  return (
    <main className="ztc-dashboard min-h-[calc(100vh-64px)] bg-[#f5f6f8] px-4 py-5 text-[#17191d] sm:px-6 lg:px-7">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_286px]">
        <div className="min-w-0 space-y-5">
          <section className="ztc-hero relative isolate min-h-[250px] overflow-hidden rounded-2xl border border-[#e4e6ea] bg-[#eceef1] sm:min-h-[282px]">
            <img
              src={featured?.image || gameMeta(featured?.game || 'valorant').image}
              alt=""
              className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_30%]"
              onError={event => { event.currentTarget.style.display = 'none' }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/95 to-white/15 sm:via-white/85"/>
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,transparent_72%,rgba(198,151,60,.2)_72%,transparent_73%)]"/>
            <div className="relative max-w-[610px] p-5 sm:p-8 lg:p-9">
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em] text-[#bd8521]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c89535]"/>{featured ? gameMeta(featured.game).label : 'ZTC ESPORTS'}
              </span>
              <h1 className="mt-1 font-display text-4xl font-extrabold uppercase leading-[.94] tracking-tight text-[#111318] sm:text-5xl">
                {featured?.title || 'TUNISIA'}<br/>
                <span className="text-[#bd9147]">{featured ? 'CHAMPIONSHIP' : 'GAMING ARENA'}</span>
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-[#41454d] sm:text-xs">
                <span className="inline-flex items-center gap-1.5"><Users size={14}/>{featured?.max_teams || 16} {lang === 'en' ? 'Teams' : lang === 'ar' ? 'فريق' : 'Équipes'}</span>
                <span className="inline-flex items-center gap-1.5"><Gift size={14}/>{featured?.prize || 'ZTC Rewards'}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={14}/>{dateLabel(featured?.date, lang)}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin size={14}/>{labels.online}</span>
              </div>
              <Link to={featured ? `/tournaments/${featured.id}` : '/tournaments'} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#c7932c] to-[#d4a84e] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:brightness-105">
                {labels.join}<ArrowRight size={15}/>
              </Link>
            </div>
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cbd0d7]"/><span className="h-1.5 w-1.5 rounded-full bg-[#c89535]"/>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-extrabold"><Gamepad2 size={18}/>{labels.games}</h2>
              <Link to="/catalog" className="flex items-center gap-1 text-[11px] font-bold text-[#5b6069] hover:text-[#b17c1c]">{labels.seeAll}<ChevronRight size={14}/></Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {games.map(game=>(
                <Link key={game.id} to={`/tournaments?game=${game.id}`} className="group relative flex h-[92px] items-center justify-center overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(27,31,38,.035)] transition hover:-translate-y-0.5 hover:border-[#d3b36c] hover:shadow-md sm:h-[102px]">
                  {game.image && <img src={game.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-[.14] transition group-hover:opacity-25"/>}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/55 to-white/35"/>
                  <div className="relative flex flex-col items-center gap-1.5 px-2 text-center">
                    <span className="text-2xl" aria-hidden="true">{game.icon}</span>
                    <span className="text-[9px] font-black uppercase leading-tight tracking-wide text-[#30343b] sm:text-[10px]">{game.short}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-extrabold"><Trophy size={18}/>{labels.ongoing}</h2>
              <Link to="/tournaments" className="flex items-center gap-1 text-[11px] font-bold text-[#5b6069] hover:text-[#b17c1c]">{labels.seeAll}<ChevronRight size={14}/></Link>
            </div>
            {upcoming.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {upcoming.map((tournament, index)=>{
                  const game = gameMeta(tournament.game)
                  const spots = regsFor(tournament.id).length
                  return (
                    <Link key={tournament.id} to={`/tournaments/${tournament.id}`} className="group overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(27,31,38,.035)] transition hover:-translate-y-0.5 hover:border-[#d3b36c] hover:shadow-md">
                      <div className="relative h-[112px] overflow-hidden bg-[#181a1e]">
                        {tournament.image
                          ? <img src={tournament.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/>
                          : <img src={game.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105"/>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"/>
                        <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide ${tournament.status === 'open' ? 'bg-emerald-500 text-white' : 'bg-white/85 text-[#34373d]'}`}>
                          {tournament.status === 'open' ? (lang === 'en' ? 'OPEN' : lang === 'ar' ? 'مفتوح' : 'EN COURS') : (lang === 'en' ? 'SOON' : lang === 'ar' ? 'قريباً' : 'À VENIR')}
                        </span>
                        {index === 0 && <span className="absolute right-2 top-2 rounded-md bg-[#c89535] px-2 py-1 text-[9px] font-black text-white">À LA UNE</span>}
                      </div>
                      <div className="p-3">
                        <div className="truncate text-[12px] font-extrabold text-[#202329]">{tournament.title}</div>
                        <div className="mt-1 text-[10px] font-semibold text-[#777d87]">{game.label}</div>
                        <div className="mt-2 space-y-1.5 border-t border-[#f0f1f3] pt-2 text-[10px] text-[#626873]">
                          <div className="flex items-center gap-1.5"><CalendarDays size={12}/>{dateLabel(tournament.date, lang)}</div>
                          <div className="flex items-center gap-1.5"><Users size={12}/>{spots} / {tournament.max_teams || 16} {lang === 'en' ? 'teams' : lang === 'ar' ? 'فريق' : 'équipes'}</div>
                          <div className="flex items-center gap-1.5 font-bold text-[#a9791e]"><Gift size={12}/>{tournament.prize || labels.free}</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#d9dce1] bg-white px-4 py-8 text-center text-xs text-[#767b84]">{labels.empty}</div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(27,31,38,.035)]">
            <div className="relative bg-[#11151b] px-4 py-4 text-white">
              <div className="absolute inset-0 bg-[linear-gradient(125deg,transparent_60%,rgba(202,157,70,.24)_60%,transparent_61%)]"/>
              <div className="relative flex items-center gap-3">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="h-12 w-12 rounded-full border border-white/20 object-cover"/>
                  : <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#292d34] text-lg font-black">{user ? (user.name || 'J')[0].toUpperCase() : <Trophy size={20}/>}</div>}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-extrabold">{user?.name || 'ZTC Player'}</div>
                  <div className="mt-1 text-[10px] text-white/55">{user ? `${labels.level} ${level}` : labels.profile}</div>
                </div>
                {user && isVipActive() && <Crown size={16} className="text-[#e7be68]"/>}
              </div>
              {user && <div className="relative mt-3">
                <div className="mb-1 flex justify-between text-[9px] text-white/65"><span>{labels.xp}</span><span>{cur} / {need}</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#b8801e] to-[#e6bd67]" style={{ width:`${progress}%` }}/></div>
              </div>}
            </div>
            {user ? (
              <div className="p-3">
                <Link to="/profile/wallet" className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-[#faf8f3]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e7ddc7] bg-[#fbf7ed] text-[#aa7b25]"><Wallet size={16}/></span>
                  <span className="min-w-0 flex-1"><span className="block text-[10px] text-[#747982]">{labels.wallet}</span><span className="block text-xs font-extrabold">{Number(user.balance || 0)} TND</span></span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#c89535] text-white"><ArrowRight size={15}/></span>
                </Link>
                <div className="mt-2 grid grid-cols-3 divide-x divide-[#eceef1] border-t border-[#eceef1] pt-3 text-center">
                  <div><div className="text-xs font-black">{registrations.length}</div><div className="mt-1 text-[9px] text-[#777d87]">{labels.tournaments}</div></div>
                  <div><div className="text-xs font-black">{teamCount}</div><div className="mt-1 text-[9px] text-[#777d87]">{labels.teams}</div></div>
                  <div><div className="text-xs font-black">#{level}</div><div className="mt-1 text-[9px] text-[#777d87]">{labels.level}</div></div>
                </div>
              </div>
            ) : (
              <div className="p-3">
                <p className="text-[11px] leading-relaxed text-[#6e737c]">Connecte-toi pour suivre tes tournois, ton portefeuille et tes récompenses.</p>
                <Link to="/login" className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#c89535] px-3 py-2 text-xs font-extrabold text-white">{labels.signIn}<ArrowRight size={14}/></Link>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#e5e7eb] bg-white p-3.5 shadow-[0_2px_8px_rgba(27,31,38,.035)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-extrabold"><CalendarDays size={16}/>{labels.nextEvents}</h2>
              <Link to="/tournaments" className="text-[9px] font-semibold text-[#858a93]">{labels.seeAll}</Link>
            </div>
            {upcoming.slice(0, 3).length ? <div className="space-y-3">
              {upcoming.slice(0, 3).map(tournament=>(
                <Link key={tournament.id} to={`/tournaments/${tournament.id}`} className="flex items-center gap-2.5">
                  <div className="h-11 w-12 shrink-0 overflow-hidden rounded-md bg-[#17191d]">
                    {(tournament.image || gameMeta(tournament.game).image) && <img src={tournament.image || gameMeta(tournament.game).image} alt="" loading="lazy" className="h-full w-full object-cover"/>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-extrabold">{tournament.title}</div>
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-[#7b8089]"><Clock3 size={10}/>{dateLabel(tournament.date, lang)}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#edf8f1] px-2 py-1 text-[9px] font-bold text-[#34845a]">{Number(tournament.entry_fee) > 0 ? `${tournament.entry_fee} TND` : labels.free}</span>
                </Link>
              ))}
            </div> : <p className="py-2 text-[10px] text-[#858a93]">{labels.empty}</p>}
          </section>

          <section className="rounded-xl border border-[#e5e7eb] bg-white p-3.5 shadow-[0_2px_8px_rgba(27,31,38,.035)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-extrabold"><Bell size={16}/>{labels.activity}</h2>
              <Link to="/orders" className="text-[9px] font-semibold text-[#858a93]">{labels.seeAll}</Link>
            </div>
            {activeOrders.length ? <div className="space-y-3">
              {activeOrders.map(order=>(
                <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f8f3e8] text-[#ad7c22]"><ShoppingBag size={15}/></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-extrabold">{order.productName || order.product || order.items?.[0]?.name || `Commande #${String(order.id).slice(-6)}`}</span>
                    <span className="mt-1 block text-[9px] text-[#7b8089]">{dateLabel(order.date, lang)}</span>
                  </span>
                  <ChevronRight size={14} className="text-[#a5a9af]"/>
                </Link>
              ))}
            </div> : <p className="py-2 text-[10px] text-[#858a93]">{labels.noActivity}</p>}
            {user && unreadNotifications > 0 && <Link to="/profile/notifications" className="mt-3 flex items-center gap-2 border-t border-[#eceef1] pt-3 text-[10px] font-bold text-[#a9791e]"><Medal size={13}/>{unreadNotifications} notifications non lues</Link>}
          </section>

          <Link to="/lfg" className="group relative block overflow-hidden rounded-xl bg-[#11151b] p-4 text-white">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_68%,rgba(201,151,55,.46)_68%,transparent_69%)]"/>
            <div className="relative">
              <div className="text-[10px] font-black uppercase tracking-[.16em] text-[#d9b364]">{labels.community}</div>
              <div className="mt-1 text-sm font-extrabold">{labels.play}</div>
              <div className="mt-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#c89535] transition group-hover:translate-x-1"><ArrowRight size={14}/></div>
            </div>
          </Link>
        </aside>
      </div>
    </main>
  )
}
