import { useState } from 'react'
import { Zap, CheckCircle2, PlayCircle, Upload, Settings, Download, FileText, Shield, Brain, Globe, Mail, ArrowRight, Loader2 } from 'lucide-react'
import type { PricingPlan, UseCase, View, UserProfile } from '../types'
import Footer from './Footer'
import { supabase } from '../lib/supabase'

type Props = { pricingPlans: PricingPlan[]; useCases: UseCase[]; setView: (v: View) => void; userProfile?: UserProfile | null }

export default function LandingPage({ pricingPlans, useCases, setView, userProfile }: Props) {
  const paidPlans = pricingPlans.filter(p => !p.is_contact_only).sort((a, b) => a.sort_order - b.sort_order)
  const customPlan = pricingPlans.find(p => p.is_contact_only)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const handleCheckout = async (plan: PricingPlan) => {
    if (plan.price_amount === 0) {
      setView('auth')
      return
    }
    
    if (!userProfile) {
      setView('auth') // User must log in to buy
      return
    }

    try {
      setCheckoutLoading(plan.id)
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          planId: plan.id, 
          returnUrl: window.location.origin 
        })
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Checkout failed')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to payment gateway')
    } finally {
      setCheckoutLoading(null)
    }
  }

  return (
    <main className="pt-16">
      {/* ===== HERO ===== */}
      <section className="relative px-6 pt-20 pb-28 overflow-hidden bg-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[140px] opacity-40 animate-pulse" />
          <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-violet-100 rounded-full blur-[120px] opacity-30" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black mb-8 border border-indigo-100 uppercase tracking-widest">
            <Zap size={12} fill="currentColor" className="animate-pulse" /> AI Document Reader ยุคใหม่
          </div>

          <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter leading-[0.95] text-slate-900 mb-6">
            อัปโหลดเอกสาร<br />
            <span className="text-gradient">AI สกัดข้อมูลให้ทันที</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-body">
            แปลงใบเสร็จ, ใบแจ้งหนี้, สัญญา หรือเอกสารทุกประเภทให้เป็นตาราง CSV หรือส่งตรงไป Google Sheets — <span className="text-slate-800 font-semibold">เริ่มต้นฟรี 8 หน้า</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={() => setView('auth')} className="w-full sm:w-auto bg-indigo-600 text-white font-bold px-10 py-4 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
              เริ่มใช้งานฟรี (8 หน้า) <ArrowRight size={16} />
            </button>
            <button className="flex items-center gap-3 text-slate-600 font-bold text-sm hover:text-indigo-600 transition-colors group px-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-all border border-slate-200"><PlayCircle size={20} /></div>
              ดูวิธีใช้งาน
            </button>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 px-6 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight text-slate-900">3 ขั้นตอนง่ายๆ</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 stagger">
            {[
              { icon: <Upload size={28} />, step: '01', title: 'อัปโหลดเอกสาร', desc: 'ลากไฟล์ PDF หรือรูปภาพวางลงในระบบ รองรับทุกประเภทเอกสาร' },
              { icon: <Settings size={28} />, step: '02', title: 'ตั้งค่า Template', desc: 'กำหนดคอลัมน์ที่ต้องการ เช่น เลขใบเสร็จ, ชื่อบริษัท, ยอดเงิน ระบบจะจำ template ไว้ใช้ซ้ำ' },
              { icon: <Download size={28} />, step: '03', title: 'ดาวน์โหลดผลลัพธ์', desc: 'Export เป็น CSV หรือเชื่อมต่อ Google Sheets ให้อัปเดตอัตโนมัติ' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all animate-fadeUp group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">{item.icon}</div>
                  <span className="text-5xl font-headline font-black text-slate-100 group-hover:text-indigo-100 transition-colors">{item.step}</span>
                </div>
                <h3 className="text-lg font-headline font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-rose-500 font-black uppercase tracking-[0.2em] text-[10px] mb-3">FEATURES</p>
            <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight text-slate-900">ทำไมต้อง P-Admin?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger">
            {[
              { icon: <Brain size={22} />, title: 'AI แม่นยำ 99%', desc: 'ใช้ Gemini AI อ่านเอกสารได้ทั้งภาษาไทยและอังกฤษ', color: 'indigo' },
              { icon: <FileText size={22} />, title: 'Template อิสระ', desc: 'กำหนดคอลัมน์ที่ต้องการเองได้เลย บันทึกไว้ใช้ซ้ำ', color: 'emerald' },
              { icon: <Globe size={22} />, title: 'Google Sheets', desc: 'ส่งข้อมูลตรงไป Google Sheets อัปเดตอัตโนมัติ', color: 'blue' },
              { icon: <Shield size={22} />, title: 'ปลอดภัย 100%', desc: 'เอกสารเข้ารหัสทุกชั้น ไม่เก็บข้อมูลส่วนตัว', color: 'rose' },
              { icon: <Zap size={22} />, title: 'ประมวลผลเร็ว', desc: 'ผลลัพธ์ออกมาใน 5-10 วินาทีต่อหน้า', color: 'amber' },
              { icon: <Download size={22} />, title: 'Export ได้ทันที', desc: 'CSV, Google Sheets หรือคัดลอกข้อมูลได้ทุกรูปแบบ', color: 'violet' },
            ].map((f, i) => (
              <div key={i} className={`p-6 rounded-2xl border border-slate-100 hover:border-${f.color}-200 hover:shadow-md transition-all animate-fadeUp`}>
                <div className={`w-10 h-10 rounded-xl bg-${f.color}-50 text-${f.color}-600 flex items-center justify-center mb-4`}>{f.icon}</div>
                <h4 className="font-headline font-bold text-slate-900 mb-1">{f.title}</h4>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      {useCases.length > 0 && (
        <section id="use-cases" className="py-24 px-6 bg-slate-50/70 border-y border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">USE CASES</p>
              <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight text-slate-900">ตัวอย่างการใช้งาน</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {useCases.map(uc => (
                <div key={uc.id} className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img src={uc.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={uc.title} />
                  </div>
                  <div className="p-8">
                    <h4 className="text-lg font-headline font-black mb-2 text-slate-900">{uc.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{uc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-rose-500 font-black uppercase tracking-[0.2em] text-[10px] mb-3">PRICING</p>
            <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight text-slate-900">เลือกแพ็กเกจที่เหมาะกับคุณ</h2>
            <p className="text-slate-500 mt-3 text-sm">1 เครดิต = 1 หน้าเอกสาร · เครดิตไม่มีวันหมดอายุ</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch mb-8">
            {paidPlans.map((plan, idx) => {
              const isPopular = idx === 1
              const hasDiscount = plan.original_price > plan.price_amount && plan.price_amount > 0
              const features: string[] = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
              return (
                <div key={plan.id} className={`p-8 rounded-3xl flex flex-col relative transition-all hover:-translate-y-1 ${isPopular ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-[1.02] z-10' : 'bg-white border-2 border-slate-100 shadow-sm'}`}>
                  {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 font-black text-[9px] px-4 py-1 rounded-full uppercase tracking-widest">ยอดนิยม</div>}
                  <h3 className={`text-xs font-black uppercase tracking-[0.15em] mb-6 ${isPopular ? 'text-indigo-200' : 'text-slate-400'}`}>{plan.name}</h3>
                  <div className="mb-6">
                    {hasDiscount && (
                      <span className={`text-lg font-bold price-original mr-2 ${isPopular ? 'text-indigo-300' : 'text-slate-300'}`}>฿{plan.original_price}</span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-headline font-black ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                        {plan.price_amount === 0 ? 'ฟรี' : `฿${plan.price_amount}`}
                      </span>
                    </div>
                    {hasDiscount && <p className={`text-xs font-bold mt-1 ${isPopular ? 'text-emerald-300' : 'text-emerald-600'}`}>ประหยัด ฿{plan.original_price - plan.price_amount}</p>}
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {features.map((f: string, fi: number) => (
                      <li key={fi} className={`flex items-start gap-3 text-sm font-medium ${isPopular ? 'text-indigo-100' : 'text-slate-600'}`}>
                        <CheckCircle2 size={16} className={`mt-0.5 flex-shrink-0 ${isPopular ? 'text-emerald-300' : 'text-emerald-500'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleCheckout(plan)} disabled={checkoutLoading === plan.id} className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 ${isPopular ? 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                    {checkoutLoading === plan.id ? <Loader2 size={16} className="animate-spin" /> : null}
                    {plan.price_amount === 0 ? 'เริ่มต้นฟรี' : 'สั่งซื้อตอนนี้'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Custom Plan */}
          {customPlan && (
            <div className="bg-slate-900 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
              <div>
                <h3 className="text-xl font-headline font-black mb-1">Custom Plan</h3>
                <p className="text-slate-400 text-sm">ต้องการแพ็กเกจแบบกำหนดเอง? ติดต่อเราเพื่อออกแบบแพ็กเกจที่เหมาะกับองค์กรของคุณ</p>
              </div>
              <a href="mailto:support@docureader.ai" className="flex items-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-2xl hover:bg-indigo-50 transition-all text-sm whitespace-nowrap">
                <Mail size={16} /> ติดต่อเรา
              </a>
            </div>
          )}
        </div>
      </section>

      <Footer setView={setView} />
    </main>
  )
}
