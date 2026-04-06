import React from 'react'
import { Key, Rocket, Mail, Lock, UserCircle2, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import type { AuthMode } from '../types'

type Props = {
  authMode: AuthMode; setAuthMode: (m: AuthMode) => void
  handleAuth: (e: React.FormEvent) => void
  email: string; setEmail: (v: string) => void
  password: string; setPassword: (v: string) => void
  fullName: string; setFullName: (v: string) => void
  phone: string; setPhone: (v: string) => void
  authLoading: boolean
  message: { type: string; text: string }
}

export default function AuthView({ authMode, setAuthMode, handleAuth, email, setEmail, password, setPassword, fullName, setFullName, phone, setPhone, authLoading, message }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-indigo-100 rounded-full blur-[100px] opacity-40" />
      </div>
      <div className="bg-white w-full max-w-md rounded-3xl p-10 border border-slate-200 shadow-xl relative z-10 animate-scaleIn">
        <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px] mb-4">
          {authMode === 'login' ? <Key size={14} /> : <Rocket size={14} />}
          {authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
        </div>
        <h2 className="text-3xl font-headline font-black text-slate-900 mb-2">
          {authMode === 'login' ? 'ยินดีต้อนรับ' : 'เริ่มต้นใช้งานฟรี'}
        </h2>
        <p className="text-slate-500 mb-8 text-sm">
          {authMode === 'login' ? 'กรุณาใส่ข้อมูลเพื่อเข้าจัดการเอกสาร' : 'สมัครวันนี้ รับฟรี 20 หน้าเอกสารทันที'}
        </p>

        {message.text && (
          <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">ชื่อ-นามสกุล</label>
                <div className="relative">
                  <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 pl-12 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="สุเมธ ใจดี" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 pl-12 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="0xx-xxx-xxxx" />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 pl-12 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="name@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 pl-12 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="••••••••" />
            </div>
          </div>
          <button disabled={authLoading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 mt-2 disabled:opacity-50">
            {authLoading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
          </button>
        </form>
        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-6 text-center w-full text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">
          {authMode === 'login' ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  )
}
