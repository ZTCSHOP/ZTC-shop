import { ytId } from './video'

export const DEFAULT_HERO_VIDEO_ID = 'pBkx_8GFqpo'
const KEY = 'ztc_hero_video'

export const getHeroVideoId = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_HERO_VIDEO_ID
    // raw can be full URL or ID
    return ytId(raw) || DEFAULT_HERO_VIDEO_ID
  } catch { return DEFAULT_HERO_VIDEO_ID }
}

export const getHeroVideoRaw = () => {
  try { return localStorage.getItem(KEY) || `https://www.youtube.com/watch?v=${DEFAULT_HERO_VIDEO_ID}` } catch { return `https://www.youtube.com/watch?v=${DEFAULT_HERO_VIDEO_ID}` }
}

export const setHeroVideo = (urlOrId) => {
  const id = ytId(urlOrId)
  if (!id) throw new Error('invalid_youtube')
  try { localStorage.setItem(KEY, urlOrId.trim()) } catch {}
  window.dispatchEvent(new CustomEvent('ztc:hero-video', { detail: id }))
  return id
}
