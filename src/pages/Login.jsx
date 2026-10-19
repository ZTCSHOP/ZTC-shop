import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { isCloudEnabled } from '../lib/supabase'
import { Shield, Mail, UserPlus, LogIn } from 'lucide-react'

export default function Login(){
  const { user, loginAdmin, loginWithEmail, signupWithEmail, sendPasswordReset } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const loc = useLocation()
  const [mode, setMode] = useState('login') // login | signup
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [adminError, setAdminError] = useState('')
  const [busy, setBusy] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotErr, setForgotErr] = useState('')
  const [forgotBusy, setForgotBusy] = useState(false)

  const from = loc.state?.from || '/orders'

  useEffect(()=>{ if(user){ nav(user.isAdmin ? '/admin' : from, {replace:true}) } }, [user])

  const handleEmail = async (e)=>{
    e.preventDefault(); setError(''); setBusy(true)
    try{
      if(mode==='signup') await signupWithEmail(name, email, password)
      else await loginWithEmail(email, password)
      nav(from)
    }catch(err){ setError(err.message) }
    finally{ setBusy(false) }
  }

  const handleForgot = async (e)=>{
    e.preventDefault(); setForgotErr(''); setForgotMsg(''); setForgotBusy(true)
    try{
      await sendPasswordReset(forgotEmail)
      setForgotMsg(t('forgot_sent'))
    }catch(err){ setForgotErr(err.message) }
    finally{ setForgotBusy(false) }
  }

  const handleAdmin = async (e)=>{    e.preventDefault(); setAdminError(''); setBusy(true)
    try{
      await loginAdmin(adminEmail, adminPass)
      nav('/admin')
    }catch(err){ setAdminError(err.message) }
    finally{ setBusy(false) }
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 py-10">
      <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-black">{t('login_title')}</h1>
          <p className="text-sm text-white/60 mt-1">{t('login_sub')}</p>
        </div>

        {/* EMAIL */}
        <div className="mt-6 rounded-2xl bg-black/30 border border-white/10 p-4">
          <div className="flex gap-2 mb-4">
            <button onClick={()=>setMode('login')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${mode==='login'?'bg-lime-400 text-black':'bg-white/5 border border-white/10'}`}><LogIn size={15}/> {t('signin')}</button>
            <button onClick={()=>setMode('signup')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${mode==='signup'?'bg-lime-400 text-black':'bg-white/5 border border-white/10'}`}><UserPlus size={15}/> {t('signup')}</button>
          </div>
          <form onSubmit={handleEmail} className="space-y-3">
            {mode==='signup' && (
              <input placeholder={t('pseudo_ph')} value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-lime-500"/>
            )}
            <input placeholder="Email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-lime-500"/>
            <input placeholder={t('pass_ph')} type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-lime-500"/>
            {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{error}</div>}
            <button disabled={busy} className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black flex items-center justify-center gap-2 disabled:opacity-60">
              <Mail size={16}/> {busy ? '...' : mode==='signup' ? t('create_account') : t('login_email')}
            </button>
            {isCloudEnabled && <p className="text-[11px] text-emerald-300/80 text-center">☁️ Compte partagé — mêmes commandes sur tous tes appareils</p>}
          </form>

          {isCloudEnabled && mode==='login' && (
            <div className="mt-3 text-center">
              <button type="button" onClick={()=>{ setForgotOpen(o=>!o); setForgotMsg(''); setForgotErr('') }} className="text-xs text-white/50 hover:text-lime-400 font-semibold underline">
                {t('forgot_pw')}
              </button>
            </div>
          )}
          {forgotOpen && (
            <form onSubmit={handleForgot} className="mt-3 space-y-3 rounded-2xl bg-black/20 border border-white/10 p-3">
              <input type="email" required placeholder="Email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-lime-500"/>
              {forgotErr && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{forgotErr}</div>}
              {forgotMsg && <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">{forgotMsg}</div>}
              <button disabled={forgotBusy} className="w-full py-2.5 rounded-xl bg-white/10 border border-white/15 font-bold text-sm disabled:opacity-60">{forgotBusy ? '...' : t('forgot_send')}</button>
            </form>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4">
          <button onClick={()=>setShowAdmin(s=>!s)} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-amber-300">
            <Shield size={15}/> Espace propriétaire — Admin ZTC {showAdmin?'▲':'▼'}
          </button>
          {showAdmin && (
            <form onSubmit={handleAdmin} className="mt-3 space-y-3">
              <input placeholder="Email admin" type="email" required value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-amber-500"/>
              <input placeholder="Mot de passe admin" type="password" required value={adminPass} onChange={e=>setAdminPass(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-amber-500"/>
              {adminError && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{adminError}</div>}
              <button className="w-full py-3 rounded-xl bg-amber-500 text-black font-black">Se connecter en Admin</button>
              <p className="text-[11px] text-white/40 text-center">Seul le propriétaire connaît ces identifiants (définis dans les variables Netlify).</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
