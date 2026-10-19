import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { isCloudEnabled, supabase } from '../lib/supabase'

export default function ResetPassword(){
  const { t } = useLang()
  const { updatePassword } = useAuth()
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(()=>{
    let mounted = true
    let sub = null
    if(isCloudEnabled){
      supabase.auth.getSession().then(({ data })=>{
        if(!mounted) return
        setReady(!!data?.session)
        setChecking(false)
      })
      const r = supabase.auth.onAuthStateChange((ev)=>{
        if(ev === 'PASSWORD_RECOVERY'){ setReady(true); setChecking(false) }
      })
      sub = r?.data?.subscription
    } else {
      setChecking(false)
    }
    return ()=>{ mounted = false; sub?.unsubscribe?.() }
  }, [])

  const submit = async (e)=>{
    e.preventDefault(); setErr('')
    if(pw.length < 6) return setErr(t('reset_short'))
    if(pw !== pw2) return setErr(t('reset_mismatch'))
    setBusy(true)
    try{
      await updatePassword(pw)
      setOk(true)
      setTimeout(()=>nav('/login'), 2500)
    }catch(ex){ setErr(ex.message) }
    finally{ setBusy(false) }
  }

  const inputCls = 'w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-lime-500'

  return (
    <div className="max-w-[520px] mx-auto px-4 py-14">
      <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-black">
          <Lock size={24}/>
        </div>
        <h1 className="text-2xl font-black mt-4">{t('reset_title')}</h1>

        {checking ? (
          <p className="text-white/50 mt-4">…</p>
        ) : ok ? (
          <div className="mt-4">
            <p className="text-emerald-300 font-bold flex items-center justify-center gap-2"><CheckCircle2 size={18}/> {t('reset_ok')}</p>
            <Link to="/login" className="inline-block mt-5 px-6 py-3 rounded-xl bg-lime-400 text-black font-black">{t('forgot_back')}</Link>
          </div>
        ) : !ready ? (
          <div className="mt-4">
            <p className="text-red-300 font-bold flex items-center justify-center gap-2"><AlertTriangle size={18}/> {t('reset_badlink')}</p>
            <Link to="/login" className="inline-block mt-5 px-6 py-3 rounded-xl bg-white/10 border border-white/15 font-bold">{t('forgot_back')}</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/60 mt-2">{t('reset_sub')}</p>
            <form onSubmit={submit} className="mt-6 space-y-3 text-left">
              <input type="password" placeholder={t('reset_new')} required value={pw} onChange={e=>setPw(e.target.value)} className={inputCls}/>
              <input type="password" placeholder={t('reset_confirm')} required value={pw2} onChange={e=>setPw2(e.target.value)} className={inputCls}/>
              {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{err}</div>}
              <button disabled={busy} className="w-full py-3.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black disabled:opacity-60">
                {busy ? '...' : t('reset_btn')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
