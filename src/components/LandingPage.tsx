import { useState } from 'react'
import { FileText, Zap, Shield, BarChart3, Clock, Rocket, PlayCircle, Upload, CheckCircle2, ChevronRight, Download, Eye, Layers, Brain, Globe, Mail, ArrowRight, Loader2 } from 'lucide-react';
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
            แปลงใบเสร็จ, ใบแจ้งหนี้, สัญญา หรือเอกสารทุกประเภทให้เป็นตาราง CSV หรือส่งตรงไป Google Sheets — <span className="text-slate-800 font-semibold">เริ่มต้นฟรี 20 หน้า</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button onClick={() => setView('auth')} className="w-full sm:w-auto bg-indigo-600 text-white font-bold px-10 py-4 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
              เริ่มใช้งานฟรี (20 หน้า) <ArrowRight size={16} />
            </button>
            <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-3 text-slate-600 font-bold text-sm hover:text-indigo-600 transition-colors group px-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-all border border-slate-200"><PlayCircle size={20} /></div>
              ดูวิดีโอแนะนำ
            </button>
          </div>

          {/* ===== VIDEO DEMO ===== */}
          <div id="demo" className="relative group max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white animate-fadeUp">
            <div className="aspect-video bg-slate-900 flex items-center justify-center cursor-pointer relative overflow-hidden">
               <img src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" alt="Demo Video Placeholder" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
               <div className="relative z-10 flex flex-col items-center gap-4 group-hover:scale-110 transition-transform">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl shadow-white/10 group-hover:bg-white transition-all">
                    <PlayCircle size={48} className="text-white group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <span className="text-white font-black text-sm uppercase tracking-widest bg-indigo-600/80 px-4 py-1 rounded-full backdrop-blur-sm">Watch 1-Min Demo</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BEFORE & AFTER EXAMPLES ===== */}
      <section className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">SEE IT IN ACTION</p>
            <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight text-slate-900 mb-4">เปลี่ยนข้อมูลยุ่งเหยิงให้เป็นระเบียบ</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm font-bold">AI ของเราไม่ได้แค่ "อ่าน" แต่ "เข้าใจ" บริบทของเอกสารและข้อความทุกรูปแบบ</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Case 1: PDF/Receipt */}
            <div className="group animate-fadeUp">
              <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all group-hover:shadow-2xl group-hover:border-indigo-100 overflow-hidden">
                <div className="rounded-[2rem] overflow-hidden bg-slate-50">
                  <img src="/images/before_after_receipt.png" className="w-full h-auto" alt="Receipt Extraction Example" />
                </div>
                <div className="p-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest mb-4">Case 01: เอกสารกระดาษ</div>
                  <h3 className="text-xl font-headline font-black text-slate-900 mb-2">สกัดใบเสร็จ / ใบกำกับภาษี</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">เปลี่ยนบิลกระดาษที่กองล้นโต๊ะ ให้เป็นข้อมูลดิจิทัลที่แยกแยะ วันที่, ร้านค้า, เลขที่ใบเสร็จ, และยอดเงินสุทธิให้คุณโดยอัตโนมัติ</p>
                </div>
              </div>
            </div>

            {/* Case 2: Chat/Text */}
            <div className="group animate-fadeUp">
              <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all group-hover:shadow-2xl group-hover:border-indigo-100 overflow-hidden">
                <div className="rounded-[2rem] overflow-hidden bg-slate-50">
                   <img src="/images/before_after_chat.png" className="w-full h-auto" alt="Chat Extraction Example" />
                </div>
                <div className="p-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest mb-4">Case 02: ข้อความไม่เป็นรูปทาง</div>
                  <h3 className="text-xl font-headline font-black text-slate-900 mb-2">สกัดแชทลูกค้า / ออเดอร์</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">ก๊อปปี้ข้อความแชทมาวาง (Copy-Paste) AI จะทำการแยกชื่อ-ที่อยู่, เบอร์โทร, รายการสินค้า และยอดโอนให้ทันที ไม่ต้องพิมพ์ตามเองให้เหนื่อย</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS (Alternating) ===== */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">STREAMLINED PROCESS</p>
            <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight text-slate-900">3 ขั้นตอนสู่ระบบงานอัตโนมัติ</h2>
          </div>

          <div className="space-y-32">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-16 animate-fadeUp">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-headline font-black mb-6 shadow-lg shadow-indigo-200">01</div>
                <h3 className="text-3xl font-headline font-black text-slate-900 mb-4">ตั้งค่าสิ่งที่คุณต้องการสกัด</h3>
                <p className="text-lg text-slate-500 leading-relaxed font-medium">ไม่ต้องเขียนโปรแกรม ไม่ต้องทำเรื่องยาก! แค่กำหนดชื่อคอลัมน์ที่คุณอยากได้ (เช่น วันที่, ยอดเงิน, เลขที่บิล) <span className="text-indigo-600 font-bold">จะกี่คอลัมน์ก็ได้</span> หน้าที่ที่เหลือปล่อยให้ AI ของเราจัดการสกัดข้อมูลมาให้เองตามคำสั่งคุณ</p>
              </div>
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-indigo-100 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition-all" />
                <div className="relative bg-white p-3 rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden transform group-hover:rotate-1 transition-all duration-700">
                   <img src="/images/step1_template.png" className="w-full h-auto rounded-3xl" alt="Template Setup UI" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16 animate-fadeUp">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-headline font-black mb-6 shadow-lg shadow-indigo-200">02</div>
                <h3 className="text-3xl font-headline font-black text-slate-900 mb-4">อัปโหลดไฟล์ หรือวางข้อความ</h3>
                <p className="text-lg text-slate-500 leading-relaxed font-medium">ลากไฟล์ PDF, รูปภาพ หรือเพียงแค่ก๊อปปี้ข้อความมายัดใส่ระบบ รองรับทุกไฟล์เอกสารและรูปภาพที่ AI สามารถอ่านออกได้ ระบบจะเริ่มประมวลผลทันทีในไม่กี่วินาที</p>
              </div>
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-indigo-100 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition-all" />
                <div className="relative bg-gradient-to-br from-indigo-500 to-indigo-700 p-12 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-white h-[400px]">
                   <div className="flex flex-col items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 animate-bounce">
                        <Upload size={48} />
                      </div>
                      <div className="text-center">
                         <p className="font-headline font-black text-2xl mb-1">Drag & Drop Here</p>
                         <p className="text-indigo-100 font-bold opacity-80 text-sm italic">Supports Multiple PDFs & Images</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-16 animate-fadeUp">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-headline font-black mb-6 shadow-lg shadow-indigo-200">03</div>
                <h3 className="text-3xl font-headline font-black text-slate-900 mb-4">รับข้อมูลเป็น CSV หรือ Sync Sheet</h3>
                <p className="text-lg text-slate-500 leading-relaxed font-medium">ข้อมูลที่ AI สกัดได้จะปรากฏในตารางทันที คุณสามารถ <span className="text-indigo-600 font-bold">ดาวน์โหลดเป็น CSV</span> ได้เลย หรือถ้ายากกว่านั้น... แค่เชื่อมต่อ <span className="text-emerald-600 font-bold underline decoration-emerald-200 decoration-4">Google Sheet</span> ข้อมูลจะถูกส่งไปอัปเดตบรรทัดใหม่ให้คุณอัตโนมัติ!</p>
              </div>
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-indigo-100 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition-all" />
                <div className="relative bg-white p-3 rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden transform group-hover:-rotate-1 transition-all duration-700">
                   <img src="/images/step3_sheets.png" className="w-full h-auto rounded-3xl" alt="Google Sheets Sync UI" />
                </div>
              </div>
            </div>
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
              { icon: <Brain size={22} />, title: 'AI เข้าใจคำสั่งพิเศษ', desc: 'สั่งงาน AI ได้ด้วยภาษามนุษย์ สั่งให้คำนวณหรือตรวจสอบเงื่อนไขได้ทันที', color: 'indigo' },
              { icon: <Globe size={22} />, title: 'รองรับหลายภาษา', desc: 'สกัดข้อมูลจากเอกสารได้ทั่วโลก รองรับทั้งภาษาไทย อังกฤษ จีน ญี่ปุ่น และอื่นๆ', color: 'blue' },
              { icon: <FileText size={22} />, title: 'Template อิสระ', desc: 'กำหนดคอลัมน์ที่ต้องการเองได้เลย บันทึกไว้ใช้ซ้ำ', color: 'emerald' },
              { icon: <Shield size={22} />, title: 'ปลอดภัย 100%', desc: 'เอกสารเข้ารหัสทุกชั้น ไม่มีการเก็บข้อมูลเพื่อนำไปเทรนโมเดลต่อ', color: 'rose' },
              { icon: <Zap size={22} />, title: 'ประมวลผลเร็ว', desc: 'ผลลัพธ์ออกมาในไม่กี่วินาที ช่วยลดเวลาทำงานได้มากกว่า 90%', color: 'amber' },
              { icon: <Download size={22} />, title: 'เชื่อมต่ออัตโนมัติ', desc: 'ส่งข้อมูลตรงไป Google Sheets หรือจะโหลดเป็น CSV ก็ได้ทันที', color: 'violet' },
            ].map((f, i) => (
              <div key={i} className={`p-6 rounded-2xl border border-slate-100 hover:border-${f.color}-200 hover:shadow-md transition-all animate-fadeUp`}>
                <div className={`w-10 h-10 rounded-xl bg-${f.color}-50 text-${f.color}-600 flex items-center justify-center mb-4`}>{f.icon}</div>
                <h4 className="font-headline font-bold text-slate-900 mb-1">{f.title}</h4>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-2xl mx-auto">
              <span className="text-indigo-600">หมายเหตุ :</span> ระบบประมวลผลด้วย AI ขั้นสูง ข้อมูลอาจมีความคลาดเคลื่อนเล็กน้อยในบางกรณี โปรดตรวจสอบความถูกต้องของข้อมูลก่อนนำไปใช้งานเสมอ
            </p>
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
            <p className="text-slate-500 mt-3 text-sm">2 เครดิต = 1 หน้าเอกสาร (หรือ 300 คำ) · เครดิตไม่มีวันหมดอายุ</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch mb-8">
            {paidPlans.map((plan) => {
              const isPopular = plan.name === 'Starter Plus'
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
          <div className="flex flex-col items-center justify-center gap-6 mt-12 py-8 border-t border-slate-100 animate-fadeIn">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Payments via Stripe</p>
             <div className="flex items-center gap-8 grayscale opacity-50 contrast-125">
               <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-6" alt="Stripe" />
               <div className="flex items-center gap-1.5 font-black text-slate-900 italic">
                 <div className="w-5 h-5 bg-indigo-600 text-white rounded-sm flex items-center justify-center not-italic text-[8px]">QR</div> PROMPTPAY
               </div>
             </div>
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

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-24 px-6 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
             <p className="text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">SUPPORT</p>
             <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight text-slate-900 italic">FAQ <span className="not-italic">คำถามที่พบบ่อย</span></h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'ข้อมูลส่วนตัวในเอกสารจะปลอดภัยไหม?', a: 'ปลอดภัย 100% ครับ เราใช้ระบบเข้ารหัสข้อมูลระดับเดียวกับธนาคาร และไม่มีการนำข้อมูลในเอกสารของลูกค้าไปเทรนโมเดล AI ต่อสาธารณะแน่นอน' },
              { q: 'รองรับเอกสารภาษาไทยไหม?', a: 'รองรับดีมากครับ! AI ของเราถูกเทรนให้เข้าใจโครงสร้างเอกสารภาษาไทย ทั้งแบบตัวพิมพ์และลายมือ (ถ้าอ่านออก)' },
              { q: 'ต่อเข้า Google Sheets ยากไหม?', a: 'ไม่ยากครับ! เรามีสคริปต์สั้นๆ ให้ก๊อปปี้ไปแปะใน Google Sheets ของคุณครั้งเดียวจบ หลังจากนั้นข้อมูลจะเด้งเข้าชีทให้อัตโนมัติทุกครั้งที่อัปโหลดไฟล์' },
              { q: 'เครดิตมีวันหมดอายุไหม?', a: 'เครดิตที่คุณซื้อจะสะสมอยู่ในบัญชีตลอดไป ไม่มีวันหมดอายุครับ ใช้เมื่อไหร่ก็ได้ตามต้องการ' },
              { q: 'ถ้า AI อ่านผิด ทำอย่างไร?', a: 'ระบบเปิดให้คุณสามารถตรวจสอบและแก้ไขข้อมูลในตาราง Dashboard ได้เสมอก่อนที่จะดาวน์โหลด หรือเลือกแก้ไข Template เพื่อสอน AI ให้แม่นยำขึ้นได้ครับ' }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2 group-hover:text-indigo-600 transition-colors">
                   <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">?</div>
                   {item.q}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed ml-8">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer setView={setView} />
    </main>
  )
}
