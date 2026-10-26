import emailjs from '@emailjs/browser'

// ── Configuration EmailJS (variables d'environnement Vite) ──────────────
// VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_PUBLIC_KEY,
// VITE_EMAILJS_TEMPLATE_WELCOME / _RECRUTEMENT / _SUPPORT
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export const TPL = {
  welcome: import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME,
  recrutement: import.meta.env.VITE_EMAILJS_TEMPLATE_RECRUTEMENT,
  support: import.meta.env.VITE_EMAILJS_TEMPLATE_SUPPORT,
}

// Le site continue de marcher même sans EmailJS configuré (no-op silencieux)
export const emailReady = !!(SERVICE_ID && PUBLIC_KEY)

const SHOP = 'ZTC-GAMING'

export async function sendEmail(templateId, params){
  if(!emailReady || !templateId) return { skipped: true }
  try{
    const res = await emailjs.send(SERVICE_ID, templateId, params, { publicKey: PUBLIC_KEY })
    return { ok: true, status: res.status }
  }catch(e){
    console.warn('EmailJS:', e?.text || e?.message || e)
    return { ok: false, error: e?.text || e?.message || 'email_error' }
  }
}

// ── 1) Email de bienvenue (à l'inscription) ─────────────────────────────
export const sendWelcomeEmail = (name, email)=> sendEmail(TPL.welcome, {
  to_email: email,
  to_name: name || '',
  user_name: name || '',
  user_email: email,
  subject: `Bienvenue chez ${SHOP} 🎮`,
  message: `Salut ${name || ''} ! Ton compte ${SHOP} est prêt. Bon shopping et bonne chance dans les tournois 🏆`,
})

// ── 2) Candidature recrutement esport ───────────────────────────────────
export const sendRecrutementEmail = (d = {})=> sendEmail(TPL.recrutement, {
  to_email: d.email || '',
  to_name: d.pseudo || '',
  from_name: d.pseudo || '',
  pseudo: d.pseudo || '', nom: d.nom || '', age: d.age || '', phone: d.phone || '',
  discord: d.discord || '', email: d.email || '', ville: d.ville || '',
  game: d.jeu || '', rank: d.rank || '', role: d.role || '', tracker: d.tracker || d.gameid || '',
  experience: d.experience || '', dispo: d.dispo || '', video: d.video || '',
  motivation: d.motivation || '', date: d.date || '',
  subject: `Nouvelle candidature — ${d.pseudo || ''} (${d.jeu || ''})`,
  message: `Candidature esport ${SHOP}\nPseudo: ${d.pseudo||'-'}\nJeu: ${d.jeu||'-'}\nRank: ${d.rank||'-'}\nRôle: ${d.role||'-'}\nAge: ${d.age||'-'}\nVille: ${d.ville||'-'}\nTel: ${d.phone||'-'}\nDiscord: ${d.discord||'-'}\nEmail: ${d.email||'-'}\nTracker: ${d.tracker||d.gameid||'-'}\nDispo: ${d.dispo||'-'}\nMotivation: ${d.motivation||'-'}`,
})

// ── 3) Message Support / contact ────────────────────────────────────────
export const sendSupportEmail = ({ name='', email='', text='', date='' } = {})=> sendEmail(TPL.support, {
  to_email: email,
  to_name: name,
  user_name: name,
  user_email: email,
  subject: `Nouveau message support — ${name || email || 'client'}`,
  message: text,
  date,
})
