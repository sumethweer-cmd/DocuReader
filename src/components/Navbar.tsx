import { useState } from 'react'
import { FileText, Shield, LogOut, ChevronDown, Coins, Zap, UserCircle2 } from 'lucide-react'
import type { View, AuthMode, UserProfile } from '../types'

type Props = {
  view: View
  setView: (v: View) => void
  session: unknown
  userProfile: UserProfile | null
  setAuthMode: (m: AuthMode) => void
  onSignOut: () => void
}

export default function Navbar({ view, setView, session, userProfile, setAuthMode, onSignOut }: Props) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="glass fixed top-0 w-full z-50 border-b border-slate-100/80 transition-all duration-300">
      <div className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setView('landing')}>
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
            <span className="material-symbols-outlined text-lg">description</span>
          </div>
          <span className="text-xl font-bold text-slate-900 font-headline tracking-tighter">DocuReader<span className="text-indigo-600 font-black">AI</span></span>
        </div>

        <nav className="hidden md:flex gap-1 items-center bg-slate-50/80 px-2 py-1 rounded-full border border-slate-100">
          {[
            { label: 'หน้าหลัก', view: 'landing' as View, onClick: () => setView('landing') },
            { label: 'ผลงาน', view: null, onClick: () => { setView('landing'); setTimeout(() => document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' }), 100) } },
            { label: 'ราคา', view: null, onClick: () => { setView('landing'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100) } },
          ].map((item, i) => (
            <button key={i} onClick={item.onClick} className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-tight transition-all ${view === item.view ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{item.label}</button>
          ))}
          {!!session && (
            <button onClick={() => setView('dashboard')} className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-tight transition-all ${view === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>จัดการเอกสาร</button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!!session ? (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-full hover:shadow-md transition-all active:scale-[0.98]">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] font-bold text-slate-900 leading-none">{userProfile?.full_name || 'บัญชี'}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Coins size={10} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-indigo-600">{userProfile?.credits?.toLocaleString() || 0} Cr</span>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner">
                  {userProfile?.full_name?.charAt(0) || 'U'}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 z-50 animate-scaleIn origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">เครดิตคงเหลือ</p>
                      <div className="flex items-center gap-2">
                        <Coins size={16} className="text-amber-500" />
                        <span className="text-xl font-black text-slate-900 font-headline">{userProfile?.credits?.toLocaleString() || 0}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">หน้า</span>
                      </div>
                    </div>
                    {userProfile?.is_admin && (
                      <button onClick={() => { setView('admin'); setShowMenu(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold text-sm">
                        <Shield size={16} /> Admin Panel
                      </button>
                    )}
                    <button onClick={() => { setView('dashboard'); setShowMenu(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-bold text-sm">
                      <FileText size={16} /> แดชบอร์ด
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    <button onClick={onSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors font-bold text-sm">
                      <LogOut size={16} /> ออกจากระบบ
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={() => { setAuthMode('login'); setView('auth') }} className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-full hover:bg-indigo-700 active:scale-95 transition-all text-sm shadow-lg shadow-indigo-100">
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-slate-200 flex justify-around items-center px-4 py-2">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center p-2 ${view === 'landing' ? 'text-indigo-600' : 'text-slate-400'}`}><Zap size={20} /><span className="text-[9px] mt-0.5 font-bold">หน้าแรก</span></button>
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center p-2 ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}><FileText size={20} /><span className="text-[9px] mt-0.5 font-bold">เอกสาร</span></button>
        <button onClick={() => session ? setView('dashboard') : setView('auth')} className="flex flex-col items-center p-2 text-slate-400"><UserCircle2 size={20} /><span className="text-[9px] mt-0.5 font-bold">บัญชี</span></button>
      </nav>
    </header>
  )
}
