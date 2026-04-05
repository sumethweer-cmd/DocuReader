import { useState, useEffect } from 'react'
import { Coins, Plus, FileText, Upload, Download, X, Loader2, Copy, ExternalLink, CheckCircle2, Trash2, ArrowUp, ArrowDown, HelpCircle, Table } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import type { View, UserProfile, ExtractionTemplate, TemplateColumn } from '../types'

type DashTab = 'upload' | 'templates' | 'history' | 'howto'

// --- Preset Templates ---
const PRESETS: { name: string; desc: string; columns: TemplateColumn[] }[] = [
  { name: 'ใบเสร็จ / Invoice', desc: 'สำหรับอ่านใบเสร็จรับเงินทั่วไป', columns: [{ name: 'เลขที่ใบเสร็จ', type: 'text' }, { name: 'วันที่', type: 'date' }, { name: 'ชื่อบริษัท', type: 'text' }, { name: 'ยอดรวม', type: 'currency' }] },
  { name: 'ใบแจ้งหนี้ / Bill', desc: 'สำหรับอ่านใบแจ้งหนี้ค่าบริการ', columns: [{ name: 'เลขที่เอกสาร', type: 'text' }, { name: 'วันครบกำหนด', type: 'date' }, { name: 'รายการ', type: 'text' }, { name: 'จำนวนเงิน', type: 'currency' }] },
  { name: 'บัตรประชาชน / ID Card', desc: 'สำหรับอ่านข้อมูลบัตรประชาชน', columns: [{ name: 'เลขบัตร', type: 'text' }, { name: 'ชื่อ-นามสกุล', type: 'text' }, { name: 'วันเกิด', type: 'date' }, { name: 'ที่อยู่', type: 'text' }] },
]

type Props = { userProfile: UserProfile | null; setView: (v: View) => void }

export default function DashboardView({ userProfile, setView }: Props) {
  const { toast } = useToast()
  const [tab, setTab] = useState<DashTab>('upload')
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [tplName, setTplName] = useState('')
  const [tplDesc, setTplDesc] = useState('')
  const [tplCols, setTplCols] = useState<TemplateColumn[]>([{ name: '', type: 'text' }])
  const [saving, setSaving] = useState(false)

  const maxCols = userProfile?.tier === 'pro' ? 8 : userProfile?.tier === 'starter' ? 5 : 4

  useEffect(() => { if (userProfile?.id) fetchTemplates() }, [userProfile?.id])

  const fetchTemplates = async () => {
    if (!userProfile?.id) return
    const { data } = await supabase.from('extraction_templates').select('*').eq('user_id', userProfile.id).order('created_at', { ascending: false })
    if (data) setTemplates(data as ExtractionTemplate[])
  }

  const addCol = () => {
    if (tplCols.length >= maxCols) { toast('error', `แพ็กเกจของคุณรองรับสูงสุด ${maxCols} คอลัมน์`); return }
    setTplCols([...tplCols, { name: '', type: 'text' }])
  }
  const removeCol = (i: number) => setTplCols(tplCols.filter((_, idx) => idx !== i))
  const updateCol = (i: number, field: keyof TemplateColumn, val: string) => {
    const next = [...tplCols]; next[i] = { ...next[i], [field]: val }; setTplCols(next)
  }
  const moveCol = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= tplCols.length) return
    const next = [...tplCols]; [next[i], next[j]] = [next[j], next[i]]; setTplCols(next)
  }

  const saveTemplate = async () => {
    if (!tplName.trim()) { toast('error', 'กรุณาตั้งชื่อ Template'); return }
    const validCols = tplCols.filter(c => c.name.trim())
    if (validCols.length === 0) { toast('error', 'กรุณาเพิ่มคอลัมน์อย่างน้อย 1 อัน'); return }
    setSaving(true)
    const { error } = await supabase.from('extraction_templates').insert({ user_id: userProfile!.id, name: tplName, description: tplDesc, columns: validCols })
    setSaving(false)
    if (error) { toast('error', error.message); return }
    toast('success', 'บันทึก Template สำเร็จ!')
    setShowBuilder(false); setTplName(''); setTplDesc(''); setTplCols([{ name: '', type: 'text' }])
    fetchTemplates()
  }

  const usePreset = (preset: typeof PRESETS[0]) => {
    setTplName(preset.name); setTplDesc(preset.desc); setTplCols(preset.columns.slice(0, maxCols))
    setShowBuilder(true); setTab('templates')
  }

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from('extraction_templates').delete().eq('id', id)
    if (error) toast('error', error.message)
    else { toast('success', 'ลบ Template แล้ว'); fetchTemplates() }
  }

  const tabs: { key: DashTab; label: string; icon: React.ReactNode }[] = [
    { key: 'upload', label: 'อัปโหลด', icon: <Upload size={16} /> },
    { key: 'templates', label: 'Templates', icon: <Table size={16} /> },
    { key: 'history', label: 'ประวัติ', icon: <FileText size={16} /> },
    { key: 'howto', label: 'วิธีใช้งาน', icon: <HelpCircle size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 md:pb-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ระบบออนไลน์</span></div>
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">จัดการเอกสาร</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><Coins size={20} /></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">เครดิต</p>
                <p className="text-xl font-black text-slate-900 font-headline leading-none">{userProfile?.credits?.toLocaleString() || 0}</p>
              </div>
            </div>
            <button onClick={() => { setView('landing'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100) }} className="h-14 px-5 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm font-bold shadow-lg shadow-indigo-100">
              <Plus size={16} /> เติมเครดิต
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Upload Tab */}
        {tab === 'upload' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="border-2 border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-white transition-all cursor-pointer group h-72 bg-white/50">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all"><Upload size={28} /></div>
                <p className="text-sm font-bold text-slate-400 group-hover:text-slate-700 text-center">ลากไฟล์วางที่นี่<br />หรือคลิกเพื่อเลือก</p>
                <p className="text-[10px] text-slate-300">PDF, JPG, PNG (สูงสุด 20MB)</p>
              </div>
              {templates.length > 0 && (
                <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">เลือก Template</p>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold">
                    <option value="">-- เลือก Template --</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({(t.columns as TemplateColumn[]).length} คอลัมน์)</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
              <FileText size={48} className="text-slate-200 mb-4" />
              <p className="text-sm font-bold text-slate-400">ยังไม่มีเอกสารที่ประมวลผล</p>
              <p className="text-xs text-slate-300 mt-1">อัปโหลดไฟล์และเลือก Template เพื่อเริ่มต้น</p>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {tab === 'templates' && (
          <div>
            {!showBuilder ? (
              <>
                {/* Presets */}
                <div className="mb-8">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">🚀 เริ่มต้นจาก Template สำเร็จรูป</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    {PRESETS.map((p, i) => (
                      <button key={i} onClick={() => usePreset(p)} className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all group">
                        <h4 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                        <p className="text-xs text-slate-400 mb-3">{p.desc}</p>
                        <div className="flex gap-1 flex-wrap">
                          {p.columns.map((c, ci) => <span key={ci} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{c.name}</span>)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {/* User Templates */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">📋 Templates ของคุณ (สูงสุด {maxCols} คอลัมน์)</p>
                  <button onClick={() => setShowBuilder(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all"><Plus size={14} /> สร้างใหม่</button>
                </div>
                {templates.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <Table size={40} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">ยังไม่มี Template</p>
                    <p className="text-xs text-slate-300 mt-1">สร้าง Template เพื่อกำหนดคอลัมน์ที่ต้องการจากเอกสาร</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {templates.map(t => (
                      <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-sm transition-all">
                        <div>
                          <h4 className="font-bold text-slate-900">{t.name}</h4>
                          {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {(t.columns as TemplateColumn[]).map((c, ci) => <span key={ci} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{c.name}</span>)}
                          </div>
                        </div>
                        <button onClick={() => deleteTemplate(t.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Template Builder */
              <div className="bg-white border border-slate-200 rounded-3xl p-8 animate-fadeUp">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-headline font-black text-slate-900">สร้าง Template ใหม่</h3>
                  <button onClick={() => setShowBuilder(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">ชื่อ Template</label>
                    <input value={tplName} onChange={e => setTplName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="เช่น ใบเสร็จค่าไฟฟ้า" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">คำอธิบาย (ไม่บังคับ)</label>
                    <input value={tplDesc} onChange={e => setTplDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="อธิบายว่า Template นี้ใช้กับเอกสารประเภทไหน" />
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">คอลัมน์ที่ต้องการ ({tplCols.length}/{maxCols})</label>
                    <button onClick={addCol} disabled={tplCols.length >= maxCols} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 flex items-center gap-1"><Plus size={12} /> เพิ่มคอลัมน์</button>
                  </div>
                  <div className="space-y-2">
                    {tplCols.map((col, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 animate-slideIn">
                        <span className="text-[10px] font-black text-slate-300 w-6 text-center">{i + 1}</span>
                        <input value={col.name} onChange={e => updateCol(i, 'name', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" placeholder="ชื่อคอลัมน์" />
                        <select value={col.type} onChange={e => updateCol(i, 'type', e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold w-24">
                          <option value="text">ข้อความ</option>
                          <option value="number">ตัวเลข</option>
                          <option value="date">วันที่</option>
                          <option value="currency">จำนวนเงิน</option>
                        </select>
                        <div className="flex gap-0.5">
                          <button onClick={() => moveCol(i, -1)} className="p-1 text-slate-300 hover:text-slate-600"><ArrowUp size={12} /></button>
                          <button onClick={() => moveCol(i, 1)} className="p-1 text-slate-300 hover:text-slate-600"><ArrowDown size={12} /></button>
                        </div>
                        {tplCols.length > 1 && <button onClick={() => removeCol(i)} className="p-1 text-slate-300 hover:text-rose-500"><X size={14} /></button>}
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={saveTemplate} disabled={saving} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} บันทึก Template
                </button>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <FileText size={48} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">ยังไม่มีประวัติการประมวลผล</p>
          </div>
        )}

        {/* How-to Tab */}
        {tab === 'howto' && <HowToGuide />}
      </div>
    </div>
  )
}

/* ===== How-to Guide Component ===== */
function HowToGuide() {
  const [guideTab, setGuideTab] = useState<'csv' | 'sheets'>('csv')
  const [sheetUrl, setSheetUrl] = useState('')
  const { toast } = useToast()
  const exampleCsvUrl = 'https://your-app-url.vercel.app/api/export/abc123'

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('success', 'คัดลอกแล้ว!')
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Guide Tab Switcher */}
      <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
        <button onClick={() => setGuideTab('csv')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${guideTab === 'csv' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Download size={14} className="inline mr-2" />Export CSV
        </button>
        <button onClick={() => setGuideTab('sheets')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${guideTab === 'sheets' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
          <ExternalLink size={14} className="inline mr-2" />Google Sheets
        </button>
      </div>

      {guideTab === 'csv' ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-lg font-headline font-black text-slate-900 mb-2">📥 วิธี Export ข้อมูลเป็น CSV</h3>
          <p className="text-sm text-slate-500 mb-6">ดาวน์โหลดข้อมูลที่ AI สกัดได้เป็นไฟล์ CSV เพื่อเปิดใน Excel หรือโปรแกรมตารางอื่นๆ</p>
          <div className="space-y-6">
            {[
              { step: 1, title: 'อัปโหลดเอกสาร', desc: 'ไปที่แท็บ "อัปโหลด" แล้วลากไฟล์ PDF หรือรูปภาพวางลงในพื้นที่อัปโหลด' },
              { step: 2, title: 'เลือก Template', desc: 'เลือก Template ที่สร้างไว้ หรือสร้างใหม่ในแท็บ "Templates" เพื่อกำหนดคอลัมน์ที่ต้องการ' },
              { step: 3, title: 'กด "เริ่มประมวลผล"', desc: 'ระบบ AI จะอ่านเอกสารและสกัดข้อมูลตามคอลัมน์ที่คุณกำหนด (ใช้เวลา 5-10 วินาที/หน้า)' },
              { step: 4, title: 'ดาวน์โหลด CSV', desc: 'เมื่อเสร็จแล้ว กดปุ่ม "Download CSV" เพื่อดาวน์โหลดไฟล์ เปิดได้ทันทีใน Excel' },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm flex-shrink-0">{s.step}</div>
                <div><h4 className="font-bold text-slate-900 text-sm">{s.title}</h4><p className="text-xs text-slate-500 mt-0.5">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <h3 className="text-lg font-headline font-black text-slate-900 mb-2">📊 วิธีเชื่อมต่อ Google Sheets</h3>
            <p className="text-sm text-slate-500 mb-6">ส่งข้อมูลที่ AI สกัดได้ตรงไปยัง Google Sheets ให้อัปเดตอัตโนมัติ</p>

            <div className="space-y-6">
              {[
                { step: 1, title: 'เปิด Google Sheets', desc: 'ไปที่ sheets.google.com แล้วสร้าง Spreadsheet ใหม่', extra: <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline mt-1"><ExternalLink size={10} /> เปิด Google Sheets</a> },
                { step: 2, title: 'คัดลอก URL ข้อมูลของคุณ', desc: 'กดปุ่มด้านล่างเพื่อคัดลอกลิงก์ข้อมูลของคุณ', extra: (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 bg-slate-100 px-3 py-2 rounded-lg text-xs text-slate-600 truncate">{exampleCsvUrl}</code>
                    <button onClick={() => copyText(exampleCsvUrl)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"><Copy size={12} /> คัดลอก</button>
                  </div>
                )},
                { step: 3, title: 'ใส่สูตร IMPORTDATA', desc: 'ในเซลล์ A1 ของ Google Sheets พิมพ์สูตรนี้:', extra: (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg text-xs text-amber-800 font-mono">=IMPORTDATA("{exampleCsvUrl}")</code>
                      <button onClick={() => copyText(`=IMPORTDATA("${exampleCsvUrl}")`)} className="bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-600 flex items-center gap-1"><Copy size={12} /></button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">* Google Sheets จะดึงข้อมูลจากลิงก์นี้โดยอัตโนมัติ</p>
                  </div>
                )},
                { step: 4, title: 'เสร็จเรียบร้อย!', desc: 'ทุกครั้งที่คุณประมวลผลเอกสารใหม่ ข้อมูลใน Google Sheets จะอัปเดตโดยอัตโนมัติ' },
              ].map(s => (
                <div key={s.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm flex-shrink-0">{s.step}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                    {s.extra}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Google Sheet URL Input */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
            <h4 className="font-bold text-emerald-900 text-sm mb-2">🔗 ผูก Google Sheet URL ของคุณ (ไม่บังคับ)</h4>
            <p className="text-xs text-emerald-700 mb-3">วาง URL ของ Google Sheet ที่คุณต้องการให้ระบบส่งข้อมูลไปอัปเดต</p>
            <div className="flex gap-2">
              <input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} className="flex-1 bg-white border border-emerald-300 rounded-xl px-4 py-2.5 text-sm" placeholder="https://docs.google.com/spreadsheets/d/..." />
              <button onClick={() => toast('success', 'บันทึก Google Sheet URL แล้ว')} className="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition-all">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
