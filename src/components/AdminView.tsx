import { useState, useEffect } from 'react'
import { Shield, X, Zap, ChevronDown, Save, Upload, ImageIcon, Plus, Loader2, Users, Coins, Key, CreditCard, Pencil, CheckCircle2, Search, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import type { View, AIConfig, PricingPlan, AdminStats } from '../types'

type AdminTab = 'stats' | 'users' | 'models' | 'pricing' | 'content' | 'settings'

type Props = {
  aiConfigs: AIConfig[]; apiKey: string; setApiKey: (v: string) => void
  stripeSecret: string; setStripeSecret: (v: string) => void
  stripePublishable: string; setStripePublishable: (v: string) => void
  toggleModel: (id: string) => void; updateSystemConfigs: () => void
  setView: (v: View) => void
  useCaseTitle: string; setUseCaseTitle: (v: string) => void
  useCaseDesc: string; setUseCaseDesc: (v: string) => void
  addUseCase: (file: File | null) => void; isAddingUseCase: boolean
  stats: AdminStats; pricingPlans: PricingPlan[]
  refreshPricing: () => void
}

export default function AdminView(props: Props) {
  const { aiConfigs, apiKey, setApiKey, stripeSecret, setStripeSecret, stripePublishable, setStripePublishable, toggleModel, updateSystemConfigs, setView, useCaseTitle, setUseCaseTitle, useCaseDesc, setUseCaseDesc, addUseCase, isAddingUseCase, stats, pricingPlans, refreshPricing } = props
  const { toast } = useToast()
  const [tab, setTab] = useState<AdminTab>('stats')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const activeModel = aiConfigs.find(c => c.is_active)

  // Pricing editor state
  const [editPlan, setEditPlan] = useState<PricingPlan | null>(null)
  const [planForm, setPlanForm] = useState({ name: '', price_amount: 0, original_price: 0, credits_awarded: 0, max_columns: 4, backlog_days: 0, is_contact_only: false, features: '' })

  const openEditPlan = (plan: PricingPlan) => {
    setEditPlan(plan)
    const features: string[] = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
    setPlanForm({ name: plan.name, price_amount: plan.price_amount, original_price: plan.original_price, credits_awarded: plan.credits_awarded, max_columns: plan.max_columns, backlog_days: plan.backlog_days, is_contact_only: plan.is_contact_only, features: features.join('\n') })
  }

  const savePlan = async () => {
    if (!editPlan) return
    const featArr = planForm.features.split('\n').filter(f => f.trim())
    const { error } = await supabase.from('pricing_plans').update({
      name: planForm.name, price_amount: planForm.price_amount, original_price: planForm.original_price,
      credits_awarded: planForm.credits_awarded, max_columns: planForm.max_columns, backlog_days: planForm.backlog_days,
      is_contact_only: planForm.is_contact_only, features: featArr
    }).eq('id', editPlan.id)
    if (error) { toast('error', error.message); return }
    toast('success', 'บันทึกแพ็กเกจสำเร็จ!')
    setEditPlan(null); refreshPricing()
  }

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'stats', label: '📊 สถิติ' }, { key: 'users', label: '👥 ผู้ใช้' },
    { key: 'models', label: '🤖 AI Model' }, { key: 'pricing', label: '💰 แพ็กเกจ' },
    { key: 'content', label: '🎨 เนื้อหา' }, { key: 'settings', label: '⚙️ ตั้งค่า' },
  ]

  // User Management State
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUserForm, setEditUserForm] = useState({ credits: 0, tier: 'free' })

  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) toast('error', error.message)
    else setUsers(data || [])
    setIsLoadingUsers(false)
  }

  const saveUserUpdate = async (uid: string) => {
    const { error } = await supabase.from('profiles').update({
      credits: editUserForm.credits,
      tier: editUserForm.tier
    }).eq('id', uid)
    if (error) { toast('error', error.message); return }
    toast('success', 'อัปเดตข้อมูลผู้ใช้สำเร็จ!')
    setEditingUserId(null)
    fetchUsers()
  }

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))

  useEffect(() => {
    if (tab === 'users') fetchUsers()
  }, [tab])

  const statCards = [
    { label: 'ผู้ใช้ทั้งหมด', value: stats.totalUsers, icon: <Users size={18} />, color: 'indigo' },
    { label: 'รายได้ (THB)', value: `฿${stats.totalRevenue.toLocaleString()}`, icon: <Coins size={18} />, color: 'emerald' },
    { label: 'AI Tokens', value: stats.totalTokens.toLocaleString(), icon: <Zap size={18} />, color: 'rose' },
    { label: 'เครดิตในระบบ', value: stats.totalCredits.toLocaleString(), icon: <Key size={18} />, color: 'amber' },
    { label: 'Admin', value: stats.activeAdmin, icon: <Shield size={18} />, color: 'blue' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><Shield size={20} /></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-headline font-black text-slate-900">Admin Panel</h1>
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">COMMAND CENTER</p>
            </div>
          </div>
          <button onClick={() => setView('landing')} className="w-full sm:w-auto bg-white border border-slate-200 rounded-full px-4 py-2 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2">
            <X size={14} /> ปิดหน้าต่าง
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{t.label}</button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statCards.map((s, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className={`w-9 h-9 bg-${s.color}-50 text-${s.color}-600 rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-6 animate-fadeUp">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:border-indigo-500 shadow-sm transition-all" placeholder="ค้นหาด้วยอีเมล หรือ ชื่อ..." />
              </div>
              <button onClick={fetchUsers} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-2">
                <RefreshCw size={14} className={isLoadingUsers ? 'animate-spin' : ''} /> รีเฟรชข้อมูล
              </button>
            </div>

            {/* Table */}
            <div className="relative group">
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden opacity-50" />
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto scrollbar-hide">
                <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">ผู้ใช้ (อีเมล/ชื่อ)</th>
                    <th className="px-6 py-4">เครดิตคงเหลือ</th>
                    <th className="px-6 py-4">Subscription Tier</th>
                    <th className="px-6 py-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{user.email}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{user.full_name || 'ไม่ได้ระบุชื่อ'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingUserId === user.id ? (
                          <input type="number" value={editUserForm.credits} onChange={e => setEditUserForm({ ...editUserForm, credits: Number(e.target.value) })} className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-indigo-600">{user.credits}</span>
                            <span className="text-[10px] text-slate-400">หน้า</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingUserId === user.id ? (
                          <select value={editUserForm.tier} onChange={e => setEditUserForm({ ...editUserForm, tier: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold">
                            {pricingPlans.map(p => <option key={p.id} value={p.name.toLowerCase().replace(/\s+/g, '_')}>{p.name}</option>)}
                            <option value="free">Free</option>
                          </select>
                        ) : (
                          <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${user.tier === 'free' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            {user.tier}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingUserId === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => saveUserUpdate(user.id)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"><CheckCircle2 size={16} /></button>
                            <button onClick={() => setEditingUserId(null)} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-all"><X size={16} /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingUserId(user.id); setEditUserForm({ credits: user.credits, tier: user.tier }); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all">
                            <Pencil size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-sm font-bold">ไม่พบรายชื่อผู้ใช้</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold italic">* การปรับเปลี่ยนเครดิตจะมีผลทันทีที่ผู้ใช้เริ่มใช้งานครั้งต่อไป</p>
        </div>
      )}

        {/* Models Tab */}
        {tab === 'models' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">เลือกโมเดลที่ใช้งาน</p>
              {activeModel && <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">ACTIVE</span>}
            </div>
            <div className="relative mb-6">
              <select value={activeModel?.id || ''} onChange={e => toggleModel(e.target.value)} className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-900 cursor-pointer focus:border-indigo-600 transition-all">
                <option value="" disabled>เลือกโมเดล AI...</option>
                {aiConfigs.map(c => <option key={c.id} value={c.id}>{c.model_name} {c.is_active ? '(ใช้งานอยู่)' : ''}</option>)}
              </select>
              <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Gemini API Key</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm" placeholder="••••••••••" />
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {tab === 'pricing' && (
          <div className="space-y-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">จัดการแพ็กเกจ (กดเพื่อแก้ไข)</p>
            {pricingPlans.sort((a, b) => a.sort_order - b.sort_order).map(plan => {
              return editPlan?.id === plan.id ? (
                /* Edit Form */
                <div key={plan.id} className="bg-white border-2 border-indigo-200 rounded-2xl p-6 animate-scaleIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ชื่อแพ็กเกจ</label><input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ราคาขาย (THB)</label><input type="number" value={planForm.price_amount} onChange={e => setPlanForm({ ...planForm, price_amount: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ราคาเต็ม (แสดงขีดฆ่า)</label><input type="number" value={planForm.original_price} onChange={e => setPlanForm({ ...planForm, original_price: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">เครดิต (หน้า)</label><input type="number" value={planForm.credits_awarded} onChange={e => setPlanForm({ ...planForm, credits_awarded: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">จำนวน Column สูงสุด</label><input type="number" value={planForm.max_columns} onChange={e => setPlanForm({ ...planForm, max_columns: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Backlog (วัน)</label><input type="number" value={planForm.backlog_days} onChange={e => setPlanForm({ ...planForm, backlog_days: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" /></div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ฟีเจอร์ (บรรทัดละ 1 รายการ)</label>
                    <textarea value={planForm.features} onChange={e => setPlanForm({ ...planForm, features: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm h-28" />
                  </div>
                  <label className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-600">
                    <input type="checkbox" checked={planForm.is_contact_only} onChange={e => setPlanForm({ ...planForm, is_contact_only: e.target.checked })} className="rounded" /> เป็นแพ็กเกจแบบติดต่อสอบถาม (ไม่แสดงราคา)
                  </label>
                  <div className="flex gap-2">
                    <button onClick={savePlan} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> บันทึก</button>
                    <button onClick={() => setEditPlan(null)} className="px-6 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200">ยกเลิก</button>
                  </div>
                </div>
              ) : (
                /* Display Card */
                <button key={plan.id} onClick={() => openEditPlan(plan)} className="w-full bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-indigo-300 hover:shadow-sm transition-all text-left">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">{plan.name}</h4>
                      {plan.is_contact_only && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">ติดต่อ</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {plan.original_price > plan.price_amount && <span className="price-original">฿{plan.original_price}</span>}
                      <span className="font-bold text-slate-900">{plan.price_amount === 0 && !plan.is_contact_only ? 'ฟรี' : plan.is_contact_only ? 'ติดต่อ' : `฿${plan.price_amount}`}</span>
                      <span>•</span><span>{plan.credits_awarded} เครดิต</span>
                      <span>•</span><span>{plan.max_columns} คอลัมน์</span>
                    </div>
                  </div>
                  <Pencil size={16} className="text-slate-300" />
                </button>
              )
            })}
          </div>
        )}

        {/* Content Tab */}
        {tab === 'content' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl">
            <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-6 flex items-center gap-2"><ImageIcon size={14} /> เพิ่มผลงานเด่น (Use Cases)</p>
            <div className="space-y-4 mb-4">
              <input value={useCaseTitle} onChange={e => setUseCaseTitle(e.target.value)} placeholder="ชื่อหัวข้อ" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
              <textarea value={useCaseDesc} onChange={e => setUseCaseDesc(e.target.value)} placeholder="คำอธิบาย" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm h-20" />
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:bg-slate-50 transition-all flex flex-col items-center gap-2 cursor-pointer" onClick={() => document.getElementById('media-upload')?.click()}>
                <input id="media-upload" type="file" className="hidden" accept="image/*,video/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                {selectedFile ? (
                  <><span className="text-xs font-bold text-slate-700">{selectedFile.name}</span><button onClick={e => { e.stopPropagation(); setSelectedFile(null) }} className="text-[10px] text-rose-500 font-bold">ยกเลิก</button></>
                ) : (
                  <><Upload size={24} className="text-slate-300" /><span className="text-[10px] font-bold text-slate-400">คลิกเพื่ออัปโหลดรูปภาพ</span></>
                )}
              </div>
              <button onClick={() => addUseCase(selectedFile)} disabled={isAddingUseCase || !useCaseTitle || !selectedFile} className="w-full bg-rose-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-600 disabled:opacity-30">
                {isAddingUseCase ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} อัปโหลด
              </button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="bg-slate-900 p-8 rounded-3xl text-white max-w-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2"><CreditCard size={14} /> Stripe Payment Keys</p>
              <div className="space-y-4 mb-6">
                <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Publishable Key</label><input value={stripePublishable} onChange={e => setStripePublishable(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 text-xs text-indigo-300" placeholder="pk_test_..." /></div>
                <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Secret Key</label><input type="password" value={stripeSecret} onChange={e => setStripeSecret(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 text-xs text-indigo-300" placeholder="sk_test_..." /></div>
              </div>
              <button onClick={updateSystemConfigs} className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl hover:bg-indigo-400 hover:text-white transition-all flex items-center justify-center gap-2 text-sm"><Save size={16} /> บันทึกทั้งหมด</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
