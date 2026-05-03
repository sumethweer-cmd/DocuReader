import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  linkToken: string
  session: unknown
  onLoginNeeded: () => void
}

export default function LinkLineView({ linkToken, session, onLoginNeeded }: Props) {
  const [status, setStatus] = useState<'loading' | 'need_login' | 'linking' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const linked = useRef(false)

  const doLink = async (userId: string) => {
    if (linked.current) return
    linked.current = true
    setStatus('linking')

    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await supabase
      .from('line_link_nonces')
      .insert({ nonce, user_id: userId })

    if (error) {
      linked.current = false
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    window.location.href =
      `https://access.line.me/dialog/bot/accountLink?linkToken=${encodeURIComponent(linkToken)}&nonce=${nonce}`
  }

  // Initial check — is the user already logged in?
  useEffect(() => {
    if (!linkToken) {
      setStatus('error')
      setErrorMsg('Missing linkToken')
      return
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) setStatus('need_login')
      // If logged in, the session-watch effect below handles it
    })
  }, [linkToken])

  // React to session becoming available (e.g. user just logged in)
  useEffect(() => {
    if (!session || !linkToken) return
    doLink((session as { user: { id: string } }).user.id)
  }, [session, linkToken])

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (status === 'linking') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-sm">กำลังเชื่อม LINE...</p>
      </div>
    </div>
  )

  if (status === 'need_login') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">เชื่อม LINE Account</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          กรุณาเข้าสู่ระบบ P-Admin ก่อน<br />
          แล้วกลับมาที่หน้านี้เพื่อเชื่อม LINE ของคุณ
        </p>
        <button
          onClick={onLoginNeeded}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition-colors"
        >
          เข้าสู่ระบบ / สมัคร
        </button>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h1>
        <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
        <a href="/" className="text-indigo-600 text-sm font-medium hover:underline">
          กลับหน้าหลัก
        </a>
      </div>
    </div>
  )

  return null
}
