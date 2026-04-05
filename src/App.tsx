import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { 
  FileText, CreditCard, X, Rocket, Shield, Key, Database, Zap, 
  LogOut, Mail, Lock, CheckCircle2, AlertCircle, Loader2, Plus, Save, Globe,
  ChevronDown, Coins, TrendingUp, Users, Upload, Image as ImageIcon, PlayCircle, Phone, UserCircle2
} from 'lucide-react'

// --- Types ---
type View = 'landing' | 'auth' | 'dashboard' | 'admin'
type AuthMode = 'login' | 'register'
type AIConfig = {
  id: string
  model_name: string
  is_active: boolean
  provider: string
  api_key?: string
  stripe_secret_key?: string
  stripe_publishable_key?: string
}
type PricingPlan = {
  id: string
  name: string
  price_amount: number
  currency: string
  credits_awarded: number
  is_active: boolean
}
type UseCase = {
  id: string
  title: string
  description: string
  media_url: string
  media_type: 'image' | 'video'
}
type AdminStats = {
  totalUsers: number
  activeAdmin: number
  totalRevenue: number
  totalTokens: number
  totalCredits: number
}

// --- Sub-components ---

const Navbar = ({ view, setView, session, userProfile, setAuthMode, onSignOut }: any) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-xl fixed top-0 w-full z-50 shadow-sm border-b border-slate-100 transition-all duration-300">
      <div className="flex justify-between items-center px-6 py-3.5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <span className="material-symbols-outlined text-xl font-bold">description</span>
          </div>
          <span className="text-xl font-bold text-slate-900 font-headline tracking-tighter">DocuReader<span className="text-indigo-600 font-black">AI</span></span>
        </div>
        
        <nav className="hidden md:flex gap-8 items-center bg-slate-50/50 px-6 py-2 rounded-full border border-slate-100">
          <button onClick={() => setView('landing')} className={`text-sm font-bold tracking-tight transition-colors ${view === 'landing' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}>หน้าหลัก</button>
          <a href="#use-cases" className="text-sm font-bold tracking-tight text-slate-500 hover:text-slate-900 transition-colors">ผลงาน</a>
          <a href="#pricing" className="text-sm font-bold tracking-tight text-slate-500 hover:text-slate-900 transition-colors">ราคา</a>
          {session && (
            <button onClick={() => setView('dashboard')} className={`text-sm font-bold tracking-tight transition-colors ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}>จัดการเอกสาร</button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {session ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-full hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[11px] font-bold text-slate-900 leading-none">{userProfile?.full_name || 'บัญชีของฉัน'}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Coins size={10} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-indigo-600 tracking-tight">{userProfile?.credits?.toLocaleString() || 0} Cr</span>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner">
                  {userProfile?.full_name?.charAt(0) || 'U'}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 text-[9px]">ยอดคงเหลือปัจจุบัน</p>
                     <div className="flex items-center gap-2">
                        <Coins size={16} className="text-amber-500" />
                        <span className="text-xl font-extrabold text-slate-900 font-headline">{userProfile?.credits?.toLocaleString() || 0}</span>
                     </div>
                  </div>
                  
                  {userProfile?.is_admin && (
                    <button 
                      onClick={() => { setView('admin'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold text-sm"
                    >
                      <Shield size={18} /> ระบบหลังบ้าน (Admin)
                    </button>
                  )}
                  <button 
                    onClick={() => { setView('dashboard'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-bold text-sm"
                  >
                    <FileText size={18} /> แดชบอร์ด
                  </button>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  <button 
                    onClick={onSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors font-bold text-sm"
                  >
                    <LogOut size={18} /> ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => { setAuthMode('login'); setView('auth') }} className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-full hover:bg-indigo-700 active:scale-95 transition-all text-sm shadow-lg shadow-indigo-100">
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const AuthView = ({ authMode, setAuthMode, handleAuth, email, setEmail, password, setPassword, fullName, setFullName, phone, setPhone, authLoading, message }: any) => (
  <div className="min-h-screen bg-[#fafbff] flex items-center justify-center p-6 text-left relative overflow-hidden">
    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 border border-slate-200 shadow-2xl relative z-10">
      <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px] mb-4">
         {authMode === 'login' ? <Key size={14} /> : <Rocket size={14} />} {authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
      </div>
      <h2 className="text-3xl font-headline font-black text-slate-900 mb-2">{authMode === 'login' ? 'ยินดีต้อนรับครับ' : 'เริ่มต้นใช้งานฟรี'}</h2>
      <p className="text-slate-500 mb-8 text-sm font-body">{authMode === 'login' ? 'กรุณาใส่ข้อมูลเพื่อเข้าจัดการเอกสารของคุณ' : 'ลงทะเบียนเพื่อปลดล็อกพลัง AI ในการกวาดข้อมูล'}</p>
      
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
              <div className="relative"><UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-body" placeholder="สุเมธ ใจดี" /></div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">เบอร์โทรศัพท์ (กรณีลืมรหัส)</label>
              <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-body" placeholder="0xx-xxx-xxxx" /></div>
            </div>
          </>
        )}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">อีเมลทางการ</label>
          <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-body" placeholder="name@email.com" /></div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">รหัสผ่าน</label>
          <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 pl-12 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-body" placeholder="••••••••" /></div>
        </div>
        <button disabled={authLoading} className="w-full bg-indigo-600 text-white font-extrabold py-4 rounded-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 min-h-[60px] shadow-xl shadow-indigo-100 mt-2 font-headline uppercase tracking-wider text-xs">
          {authLoading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
        </button>
      </form>
      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-8 text-center w-full text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
        {authMode === 'login' ? "ยังไม่มีบัญชี? กดสมัครตรงนี้ครับ" : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบได้เลย"}
      </button>
    </div>
  </div>
)

const AdminView = ({ aiConfigs, apiKey, setApiKey, stripeSecret, setStripeSecret, stripePublishable, setStripePublishable, toggleModel, updateSystemConfigs, useCases, setView, useCaseTitle, setUseCaseTitle, useCaseDesc, setUseCaseDesc, addUseCase, isAddingUseCase, stats }: {
  aiConfigs: AIConfig[],
  apiKey: string,
  setApiKey: (v: string) => void,
  stripeSecret: string,
  setStripeSecret: (v: string) => void,
  stripePublishable: string,
  setStripePublishable: (v: string) => void,
  toggleModel: (id: string) => void,
  updateSystemConfigs: () => void,
  setView: (v: View) => void,
  useCaseTitle: string,
  setUseCaseTitle: (v: string) => void,
  useCaseDesc: string,
  setUseCaseDesc: (v: string) => void,
  addUseCase: (file: File | null) => void,
  isAddingUseCase: boolean,
  stats: AdminStats
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const activeModel = aiConfigs.find(c => c.is_active);

  return (
    <div className="min-h-screen bg-[#fcfdff] pt-24 pb-12 px-6 text-left">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-100"><Shield size={28} /></div>
            <div><h1 className="text-3xl font-headline font-black text-slate-900 tracking-tighter">ระบบจัดการหลังบ้าน</h1><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ADMIN COMMAND CENTER OVERVIEW</p></div>
          </div>
          <button onClick={() => setView('landing')} className="bg-white border border-slate-200 rounded-full px-5 py-2 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 transition-all"><X size={16} /> ออกจากระบบหลังบ้าน</button>
        </div>

        {/* --- Phase 1: Stats Dashboard --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Users size={20} /></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">จำนวนผู้ใช้ทั้งหมด</p><h3 className="text-3xl font-black text-slate-900">{stats.totalUsers.toLocaleString()}</h3></div>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-auto"><TrendingUp size={12} /> ยอดรวมปัจจุบัน</p>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Coins size={20} /></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">รายได้รวม (THB)</p><h3 className="text-3xl font-black text-slate-900">฿{stats.totalRevenue.toLocaleString()}</h3></div>
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-auto">จากการเติมเงินจริง</p>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><Zap size={20} /></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ปริมาณ AI Tokens</p><h3 className="text-3xl font-black text-slate-900">{stats.totalTokens.toLocaleString()}</h3></div>
              <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-auto">ประมวลผลไปแล้ว</p>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Key size={20} /></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">เครดิตค้างในระบบ</p><h3 className="text-3xl font-black text-slate-900">{stats.totalCredits.toLocaleString()}</h3></div>
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-auto">Credit Circulation</p>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Shield size={20} /></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">จำนวน Admin</p><h3 className="text-3xl font-black text-slate-900">{stats.activeAdmin.toLocaleString()}</h3></div>
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-auto">ความดูแลระบบ</p>
           </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* --- AI Model Selector (Dropdown) --- */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[10px]"><Zap size={14} fill="currentColor" /> เลือกโมเดลที่ใช้งานหลัก</div>
                 {activeModel && <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase">กำลังเชื่อมต่อ</span>}
              </div>
              <div className="mb-8">
                 <div className="relative">
                    <select 
                      value={activeModel?.id || ''} 
                      onChange={(e) => toggleModel(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="" disabled>คลิกเพื่อเลือกโมเดล AI...</option>
                      {aiConfigs.map(config => (
                        <option key={config.id} value={config.id}>{config.model_name} {config.is_active ? '(ใช้งานอยู่)' : ''}</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={20} /></div>
                 </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Gemini API Key (Google Cloud)</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-body outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-body" placeholder="••••••••••••••••" />
              </div>
            </div>
            
            {/* --- Use Case Media Upload --- */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-8 font-black uppercase tracking-widest text-[10px] text-rose-500">
                  <div className="flex items-center gap-2"><ImageIcon size={14} /> เพิ่มผลงานเด่น (Use Cases)</div>
               </div>
               <div className="space-y-4 mb-4">
                  <input value={useCaseTitle} onChange={e => setUseCaseTitle(e.target.value)} placeholder="ชื่อหัวข้อ (เช่น Invoice PDF Reader)" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-body outline-none focus:ring-2 focus:ring-rose-500" />
                  <textarea value={useCaseDesc} onChange={e => setUseCaseDesc(e.target.value)} placeholder="คำอธิบายสั้นๆ" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-body outline-none focus:ring-2 focus:ring-rose-500 h-24" />
                  
                  <div className="relative group overflow-hidden border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-rose-50 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer" onClick={() => document.getElementById('media-upload')?.click()}>
                     <input id="media-upload" type="file" className="hidden" accept="image/*,video/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                     {selectedFile ? (
                        <>
                          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-bold text-xs"><ImageIcon size={24} /></div>
                          <span className="text-xs font-black text-slate-900">{selectedFile.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-[10px] text-rose-500 font-bold uppercase underline">ยกเลิก</button>
                        </>
                     ) : (
                        <>
                          <div className="w-12 h-12 bg-slate-100 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all"><Upload size={24} /></div>
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-rose-600 uppercase tracking-widest">คลิกเพื่ออัปโหลดรูปภาพผลงาน</span>
                        </>
                     )}
                  </div>

                  <button 
                    onClick={() => addUseCase(selectedFile)} 
                    disabled={isAddingUseCase || !useCaseTitle || (!selectedFile)}
                    className="w-full bg-rose-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-600 transition-all disabled:opacity-30 shadow-lg shadow-rose-100"
                  >
                    {isAddingUseCase ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} อัปโหลดขึ้นระบบทันที
                  </button>
               </div>
            </div>
          </div>
          
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden h-fit sticky top-24">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10 text-left">
              <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-8"><Globe size={14} /> การตั้งค่าระบบชำระเงิน (Stripe THB)</div>
              <div className="space-y-6 text-left">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-4 group hover:bg-white/[0.08] transition-all">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} /> Stripe Live Status</span>
                     <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-[9px] font-black border border-rose-500/20 uppercase tracking-tighter">Sandbox Mode</div>
                  </div>
                  <div className="space-y-4">
                    <div><label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Publishable Key</label><input value={stripePublishable} onChange={e => setStripePublishable(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 text-xs outline-none focus:border-indigo-400 transition-all font-body text-indigo-300" placeholder="pk_test_..." /></div>
                    <div><label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Secret Key</label><input type="password" value={stripeSecret} onChange={e => setStripeSecret(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 text-xs outline-none focus:border-indigo-400 transition-all font-body text-indigo-300" placeholder="sk_test_..." /></div>
                  </div>
                </div>
                <button onClick={updateSystemConfigs} className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl hover:bg-indigo-400 hover:text-white transition-all flex items-center justify-center gap-2 mt-4 font-headline uppercase tracking-widest text-xs shadow-lg"><Save size={18} /> บันทึกการเชื่อมต่อทั้งหมด</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LandingPage = ({ pricingPlans, useCases, setView }: any) => (
  <main className="pt-20 text-left">
    <section className="relative px-6 pt-24 pb-32 overflow-hidden bg-white">
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20"><div className="absolute top-20 right-20 w-96 h-96 bg-indigo-200 rounded-full blur-[120px] animate-pulse"></div><div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-100 rounded-full blur-[120px] delay-1000 animate-pulse"></div></div>
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50/80 backdrop-blur-sm text-indigo-600 text-[10px] font-black mb-10 border border-indigo-100 uppercase tracking-widest shadow-sm"><Zap size={14} fill="currentColor" className="animate-pulse" /> Precision AI Core 3.1.0 พร้อมประมวลผล</div>
        <h1 className="text-6xl md:text-8xl font-headline font-black tracking-tightest leading-[0.95] text-slate-900 mb-8 font-headline mix-blend-multiply italic">กวาดทุกข้อมูล <br /><span className="text-indigo-600 font-headline not-italic">ด้วยสายตา AI.</span></h1>
        <p className="text-xl md:text-2xl text-slate-500 font-body max-w-3xl mx-auto mb-12 leading-relaxed text-center font-body font-medium tracking-tight">ระบบอ่านเอกสารอัตโนมัติ (OCR 2.0) ที่เข้าใจโครงสร้างตารางและใบสำคัญทุกประเภท <span className="text-slate-900 font-bold underline decoration-indigo-400 decoration-4">แม่นยำ 99.9%</span> ลดงานมือพนักงานได้ทันทีค่รับ</p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button onClick={() => setView('auth')} className="w-full sm:w-auto bg-indigo-600 text-white font-black px-12 py-5 rounded-[2rem] shadow-2xl shadow-indigo-200 active:scale-95 transition-all hover:bg-slate-900 hover:shadow-indigo-300/50 uppercase tracking-widest text-xs">เริ่มต้นใช้งานฟรีวันนี้</button>
          <button className="flex items-center gap-3 text-slate-900 font-black uppercase tracking-widest text-xs hover:text-indigo-600 transition-colors group px-6"><div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:scale-110 transition-all shadow-sm"><PlayCircle size={24} /></div> วิดีโอแนะนำการทำงาน</button>
        </div>
      </div>
      <div className="mt-24 max-w-6xl mx-auto px-4 perspective-1000"><div className="aspect-[16/9] rounded-[3rem] overflow-hidden bg-slate-900 border-[12px] border-slate-50 shadow-[0_80px_100px_-20px_rgba(0,0,0,0.15)] relative transform rotate-x-6 hover:rotate-x-0 transition-transform duration-1000 ease-out"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_hkxvYSXOuXxMxFEBVSX-dPKo_JElkjmJDZJB-TLvgIbZKamroj6j9cX6kQ_RZIDE2R873Ti33Zqs7t83DfbVr1VPW5pfRh3sMyMp6oH9ws7VxNWZyLPU0VWcFM9QYs5-9ROVjs8-etF2Z8VXoUQElptj3xHE4bP5zM8aHUfjHO7OHwgDGgwcIUnNmTecJMuiQEicEfH1-YzMi5XqnBImoREswKDu79d1sjXkzqubtIvw3qQ0HLuMd91zfgtfjZvg8YgVbljgsPk" className="w-full h-full object-cover opacity-90" /></div></div>
    </section>
    
    <section id="use-cases" className="py-32 px-6 bg-[#fafbff]"><div className="max-w-7xl mx-auto text-center mb-24"><div className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4">ENGINEERED FOR EXCELLENCE</div><h2 className="text-4xl md:text-6xl font-headline font-black tracking-tighter text-slate-900">ตัวอย่างการใช้งานจริง</h2></div>
      <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
        {useCases.map((uc: any) => (
          <div key={uc.id} className="rounded-[3rem] overflow-hidden bg-white border border-slate-100 shadow-xl shadow-indigo-50/50 hover:shadow-indigo-100 transition-all group">
            <div className="aspect-square bg-slate-50 overflow-hidden relative"><img src={uc.media_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /><div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">{uc.media_type === 'video' ? 'VIDEO' : 'IMAGE'}</div></div>
            <div className="p-10 text-left relative"><div className="w-1 h-12 bg-indigo-600 absolute left-0 top-10"></div><h4 className="text-2xl font-headline font-black mb-4 text-slate-900 tracking-tight">{uc.title}</h4><p className="text-sm text-slate-500 leading-relaxed font-body font-medium">{uc.description}</p></div>
          </div>
        ))}
      </div>
    </section>

    <section id="pricing" className="py-32 px-6 bg-white overflow-hidden relative">
       <div className="max-w-7xl mx-auto text-center mb-24"><div className="text-rose-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4">PAY ONLY FOR WHAT YOU NEED</div><h2 className="text-4xl md:text-6xl font-headline font-black tracking-tighter text-slate-900">แพ็กเกจการใช้งาน <span className="text-indigo-600">(บาท)</span></h2></div>
       <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch relative z-10 px-4">
         {pricingPlans.map((plan: any, idx: number) => (
           <div key={plan.id} className={`p-12 rounded-[3.5rem] bg-white border-2 ${idx === 1 ? 'border-indigo-600 shadow-[0_50px_100px_-20px_rgba(79,70,229,0.2)] scale-105 z-10' : 'border-slate-50 shadow-sm'} flex flex-col text-left relative transition-all hover:translate-y-[-8px]`}>
             {idx === 1 && <div className="absolute top-0 right-10 bg-indigo-600 text-white font-black uppercase text-[9px] px-5 py-2 rounded-b-2xl tracking-[0.2em] shadow-lg">ยอดนิยม</div>}
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10 font-headline">{plan.name}</h3>
             <div className="mb-10 flex items-baseline gap-2"><span className="text-6xl font-headline font-black text-slate-900 tracking-tighter">฿{plan.price_amount}</span></div>
             <ul className="space-y-6 mb-12 flex-grow"><li className="flex items-center gap-4 text-sm text-slate-600 font-bold"><div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle2 size={14} /></div> {plan.credits_awarded} เครดิต (API Calls)</li><li className="flex items-center gap-4 text-sm text-slate-600 font-bold"><div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle2 size={14} /></div> เชื่อมต่อ Gemini 3.1 V5</li><li className="flex items-center gap-4 text-sm text-slate-600 font-bold"><div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle2 size={14} /></div> Export ข้อมูลทันที</li></ul>
             <button onClick={() => setView('auth')} className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${idx === 1 ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-50 text-slate-900 hover:bg-slate-100 shadow-slate-100'}`}>สั่งซื้อตอนนี้เลย</button>
           </div>
         ))}
       </div>
    </section>
  </main>
)

const DashboardView = ({ userProfile, setView }: any) => (
  <div className="min-h-screen bg-[#f8f9fc] pt-28 px-6 text-left">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ระบบประมวลผล: ออนไลน์</span>
           </div>
           <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tightest leading-none">จัดการเอกสารของคุณ</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 pr-6 min-w-[200px]">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500"><Coins size={24} /></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">เครดิตทรัพยากร</p><p className="text-2xl font-headline font-black text-slate-900 leading-none">{userProfile?.credits?.toLocaleString() || 0} Cr</p></div>
           </div>
           <button onClick={() => { setView('landing'); setTimeout(() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }, 100) }} className="h-20 w-20 bg-indigo-600 text-white rounded-3xl flex flex-col items-center justify-center gap-1 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"><Plus size={24} /><span className="text-[9px] font-black uppercase tracking-widest">เติมเครดิต</span></button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-4 gap-6">
         <div className="md:col-span-1 border-2 border-dashed border-slate-300 rounded-[3rem] p-10 flex flex-col items-center justify-center gap-6 hover:border-indigo-400 hover:bg-white transition-all cursor-pointer group h-80 bg-slate-50/50">
            <div className="w-20 h-20 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:shadow-xl group-hover:shadow-indigo-50 transition-all"><FileText size={36} /></div>
            <div className="text-center font-black uppercase tracking-widest text-xs text-slate-400 group-hover:text-slate-900">อัปโหลดไฟล์ใหม่</div>
         </div>
         <div className="md:col-span-3 bg-white border border-slate-200 rounded-[3rem] p-10 flex flex-col items-center justify-center text-slate-300 overflow-hidden relative">
            <div className="absolute top-10 left-10"><Database size={40} className="opacity-5" /></div>
            <p className="text-sm font-bold font-body italic text-slate-400">ยังไม่มีข้อมูลการประมวลผลปัจจุบันของคุณครับ</p>
         </div>
      </div>
    </div>
  </div>
)

// --- Main App Component ---

function App() {
  const [view, setView] = useState<View>('landing')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([])
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [apiKey, setApiKey] = useState('')
  const [stripeSecret, setStripeSecret] = useState('')
  const [stripePublishable, setStripePublishable] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeAdmin: 0, totalRevenue: 0, totalTokens: 0, totalCredits: 0 })

  // UseCase Form State
  const [useCaseTitle, setUseCaseTitle] = useState('')
  const [useCaseDesc, setUseCaseDesc] = useState('')
  const [isAddingUseCase, setIsAddingUseCase] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setUserProfile(null)
    })
    fetchPricing()
    fetchUseCases()
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setUserProfile(data)
  }

  const fetchPricing = async () => {
    const { data } = await supabase.from('pricing_plans').select('*').eq('is_active', true).order('price_amount', { ascending: true })
    if (data) setPricingPlans(data)
  }

  const fetchUseCases = async () => {
    const { data } = await supabase.from('use_cases').select('*').order('created_at', { ascending: false })
    if (data) setUseCases(data)
  }

  const fetchAdminStats = async () => {
    try {
      const { data: users } = await supabase.from('profiles').select('id, is_admin, credits')
      const { data: transactions } = await supabase.from('transactions').select('amount').eq('status', 'success')
      const { data: logs } = await supabase.from('usage_logs').select('tokens_used')
      
      const newStats = {
        totalUsers: users?.length || 0,
        activeAdmin: users?.filter(u => u.is_admin)?.length || 0,
        totalRevenue: transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        totalTokens: logs?.reduce((sum, l) => sum + (l.tokens_used || 0), 0) || 0,
        totalCredits: users?.reduce((sum, u) => sum + (u.credits || 0), 0) || 0
      }
      setStats(newStats)
    } catch(e) { console.error(e) }
  }

  const fetchAdminData = async () => {
    const { data: configs } = await supabase.from('ai_configs').select('*').order('model_name', { ascending: true })
    if (configs) setAiConfigs(configs)
    const activeConfig = configs?.find(c => c.is_active)
    if (activeConfig) {
      setStripeSecret(activeConfig.stripe_secret_key || '')
      setStripePublishable(activeConfig.stripe_publishable_key || '')
    }
    fetchAdminStats()
  }

  useEffect(() => {
    if (view === 'admin' && userProfile?.is_admin) fetchAdminData()
  }, [view, userProfile])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setMessage({ type: '', text: '' })
    try {
      if (authMode === 'register') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phone
            }
          }
        })
        if (error) throw error
        setMessage({ type: 'success', text: 'ไปยืนยันตัวตนในอีเมลของคุณได้เลยครับ!' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setView('dashboard')
      }
    } catch (err: any) { setMessage({ type: 'error', text: err.message }) }
    finally { setAuthLoading(false) }
  }

  const toggleModel = async (id: string) => {
    await supabase.from('ai_configs').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000') 
    await supabase.from('ai_configs').update({ is_active: true }).eq('id', id)
    fetchAdminData()
  }

  const updateSystemConfigs = async () => {
    const activeModel = aiConfigs.find(c => c.is_active)
    if (!activeModel) return
    const { error } = await supabase.from('ai_configs').update({ 
      api_key: apiKey || activeModel.api_key,
      stripe_secret_key: stripeSecret,
      stripe_publishable_key: stripePublishable 
    }).eq('id', activeModel.id)
    if (error) alert('Error: ' + error.message)
    else { alert('บันทึกข้อมูลเรียบร้อยครับ'); setApiKey('') }
  }

  const uploadToSupabase = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('use_case_media').upload(fileName, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('use_case_media').getPublicUrl(fileName)
    return publicUrl
  }

  const addUseCase = async (file: File | null) => {
    if (!file) { alert('กรุณาเลือกไฟล์ก่อนนะครับ'); return }
    setIsAddingUseCase(true)
    try {
      const publicUrl = await uploadToSupabase(file)
      const { error } = await supabase.from('use_cases').insert([{
        title: useCaseTitle,
        description: useCaseDesc,
        media_url: publicUrl,
        media_type: 'image'
      }])
      if (!error) {
        setUseCaseTitle('')
        setUseCaseDesc('')
        fetchUseCases()
        alert('อัปโหลดผลงานสำเร็จครับ!')
      } else {
        throw error
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setIsAddingUseCase(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setView('landing')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="font-body selection:bg-indigo-100 bg-[#fdfdff] min-h-screen">
      <Navbar view={view} setView={setView} session={session} userProfile={userProfile} setAuthMode={setAuthMode} onSignOut={handleSignOut} />
      
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {view === 'landing' && <LandingPage pricingPlans={pricingPlans} useCases={useCases} setView={setView} />}
        
        {view === 'auth' && (
          <AuthView 
            authMode={authMode} setAuthMode={setAuthMode} handleAuth={handleAuth} 
            email={email} setEmail={setEmail} password={password} setPassword={setPassword} 
            fullName={fullName} setFullName={setFullName} phone={phone} setPhone={setPhone}
            authLoading={authLoading} message={message} 
          />
        )}
        
        {view === 'admin' && (
          <AdminView 
            aiConfigs={aiConfigs} apiKey={apiKey} setApiKey={setApiKey} 
            stripeSecret={stripeSecret} setStripeSecret={setStripeSecret} 
            stripePublishable={stripePublishable} setStripePublishable={setStripePublishable}
            toggleModel={toggleModel} updateSystemConfigs={updateSystemConfigs} 
            setView={setView}
            useCaseTitle={useCaseTitle} setUseCaseTitle={setUseCaseTitle}
            useCaseDesc={useCaseDesc} setUseCaseDesc={setUseCaseDesc}
            addUseCase={addUseCase} isAddingUseCase={isAddingUseCase}
            stats={stats}
          />
        )}
        
        {view === 'dashboard' && (
          session ? <DashboardView userProfile={userProfile} setView={setView} /> : <AuthView authMode={authMode} setAuthMode={setAuthMode} handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} fullName={fullName} setFullName={setFullName} phone={phone} setPhone={setPhone} authLoading={authLoading} message={message} />
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-40 bg-white/80 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] shadow-2xl flex justify-around items-center px-4 py-3 border-b-4 border-b-indigo-100">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center p-2 ${view === 'landing' ? 'text-indigo-600' : 'text-slate-400'}`}><Zap size={22} /><span className="text-[9px] mt-1 font-black uppercase tracking-widest font-body">หน้าแรก</span></button>
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center p-2 ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}><FileText size={22} /><span className="text-[9px] mt-1 font-black uppercase tracking-widest font-body">เอกสาร</span></button>
        <button onClick={() => setView('auth')} className="flex flex-col items-center p-2 text-slate-400"><UserCircle2 size={22} /><span className="text-[9px] mt-1 font-black uppercase tracking-widest font-body">บัญชี</span></button>
      </nav>
    </div>
  )
}

export default App
