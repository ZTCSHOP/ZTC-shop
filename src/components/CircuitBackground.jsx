// Fond global : carte électronique dorée + électricité qui circule.
// L'image est compressée (≈300 Ko / ≈110 Ko mobile) pour rester léger.
const SPARKS = [
  { top: '16%', left: '5%',  dx: '280px', dy: '120px', dur: '5.5s', delay: '0s',   size: 4 },
  { top: '32%', left: '22%', dx: '240px', dy: '160px', dur: '6.8s', delay: '1.2s', size: 3 },
  { top: '58%', left: '9%',  dx: '320px', dy: '-90px', dur: '7.4s', delay: '2.1s', size: 5 },
  { top: '71%', left: '34%', dx: '200px', dy: '-140px', dur: '6.1s', delay: '0.6s', size: 3 },
  { top: '12%', left: '48%', dx: '180px', dy: '220px', dur: '7.9s', delay: '3.0s', size: 4 },
  { top: '44%', left: '55%', dx: '260px', dy: '70px',  dur: '5.9s', delay: '1.8s', size: 3 },
  { top: '24%', left: '72%', dx: '210px', dy: '180px', dur: '6.6s', delay: '0.4s', size: 5 },
  { top: '66%', left: '63%', dx: '300px', dy: '-120px', dur: '8.2s', delay: '2.7s', size: 3 },
  { top: '82%', left: '80%', dx: '200px', dy: '-160px', dur: '7.1s', delay: '1.0s', size: 4 },
  { top: '40%', left: '88%', dx: '-220px', dy: '140px', dur: '6.4s', delay: '3.6s', size: 3 },
]

export default function CircuitBackground(){
  const base = import.meta.env.BASE_URL || '/'
  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#07060a]">
      <picture>
        <source media="(max-width: 768px)" srcSet={`${base}circuit-bg-sm.jpg`} />
        <img
          src={`${base}circuit-bg.jpg`}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="circuit-bg-img absolute inset-0 w-full h-full object-cover"
        />
      </picture>

      {/* Voile sombre pour garder le texte lisible */}
      <div className="absolute inset-0 bg-[#060509]/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#060509]/75 via-transparent to-[#060509]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,5,9,0.65)_100%)]" />

      {/* Balayages lumineux : font briller les pistes dorées de l'image */}
      <div className="circuit-sweep circuit-sweep-a" />
      <div className="circuit-sweep circuit-sweep-b" />

      {/* Petites étincelles qui parcourent la carte */}
      {SPARKS.map((s, i)=>(
        <span
          key={i}
          className="circuit-spark"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDuration: s.dur,
            animationDelay: s.delay,
            '--dx': s.dx,
            '--dy': s.dy,
          }}
        />
      ))}
    </div>
  )
}
