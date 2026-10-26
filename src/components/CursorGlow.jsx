import { useEffect, useRef } from 'react'

export default function CursorGlow(){
  const glowRef = useRef(null)

  useEffect(()=>{
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if(!finePointer || reducedMotion) return

    let frame = 0
    const onMove = (event)=>{
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(()=>{
        const glow = glowRef.current
        if(!glow) return
        glow.style.transform = `translate3d(${event.clientX - 30}px, ${event.clientY - 30}px, 0)`
        glow.classList.add('is-visible')
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return ()=>{
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true"/>
}
