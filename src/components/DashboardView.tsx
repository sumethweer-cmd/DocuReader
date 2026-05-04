import { useState, useEffect, useRef } from 'react'
import { Coins, Plus, FileText, Upload, Download, X, Loader2, Copy, ExternalLink, CheckCircle2, Trash2, ArrowUp, ArrowDown, HelpCircle, Table, Zap, AlertCircle, Files, Info, Pencil, UserCircle2, Globe, RotateCcw, Users, Link, Building2, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import type { View, UserProfile, ExtractionTemplate, TemplateColumn, Document } from '../types'

type DashTab = 'upload' | 'templates' | 'history' | 'howto' | 'team'

// TODO: อัปเดตอีเมลนี้เมื่อ setup Google account สำหรับ P-Admin แล้ว
const PADMIN_SHEETS_EMAIL = 'padmin.sync@gmail.com'

const PRESETS: { name: string; desc: string; columns: TemplateColumn[]; tier: 'Starter' | 'Pro'; category: string; custom_prompt?: string }[] = [
  // FINANCE
  { name: 'ใบแจ้งหนี้ / Invoice', desc: 'สำหรับสกัดข้อมูลจากใบแจ้งหนี้ค่าสินค้าและบริการ', columns: [{ name: 'เลขที่ใบแจ้งหนี้', type: 'text' }, { name: 'วันที่', type: 'date' }, { name: 'ผู้ออกเอกสาร', type: 'text' }, { name: 'ยอดรวมสุทธิ', type: 'currency' }], tier: 'Starter', category: 'finance' },
  { name: 'ใบเสร็จรับเงิน / Receipt', desc: 'ใบเสร็จรับเงินค่าใช้จ่ายทั่วไป', columns: [{ name: 'เลขที่ใบเสร็จ', type: 'text' }, { name: 'วันที่', type: 'date' }, { name: 'รายการ', type: 'text' }, { name: 'ราคารวม', type: 'currency' }], tier: 'Starter', category: 'finance' },
  { name: 'สลิปโอนเงิน / Bank Slip', desc: 'สกัดข้อมูลจากสลิปธนาคารเพื่อตรวจสอบยอด', columns: [{ name: 'ธนาคาร', type: 'text' }, { name: 'วัน-เวลาที่โอน', type: 'text' }, { name: 'ผู้โอน', type: 'text' }, { name: 'จำนวนเงิน', type: 'currency' }, { name: 'เลขที่อ้างอิง', type: 'text' }], tier: 'Starter', category: 'finance' },
  { name: 'ใบกำกับภาษี / Tax Invoice', desc: 'ข้อมูลสำหรับออกรายงานภาษีซื้อ/ขาย', columns: [{ name: 'เลขที่ใบกำกับ', type: 'text' }, { name: 'วันที่', type: 'date' }, { name: 'เลขประจำตัวผู้เสียภาษี', type: 'text' }, { name: 'ราคาก่อน VAT', type: 'currency' }, { name: 'VAT', type: 'currency' }, { name: 'ยอดรวม', type: 'currency' }], tier: 'Pro', category: 'finance' },

  // ADMIN & HR
  { name: 'บัตรประชาชน / ID Card', desc: 'อ่านข้อมูลหน้าบัตรประชาชน', columns: [{ name: 'เลขประจำตัว', type: 'text' }, { name: 'ชื่อ-นามสกุล', type: 'text' }, { name: 'วันเกิด', type: 'date' }, { name: 'ที่อยู่', type: 'text' }], tier: 'Starter', category: 'admin' },
  { name: 'พาสปอร์ต / Passport', desc: 'สกัดข้อมูลจากหน้า Passport สำหรับตรวจสอบสิทธิ์', columns: [{ name: 'เลขพาสปอร์ต', type: 'text' }, { name: 'สัญชาติ', type: 'text' }, { name: 'ชื่อ-นามสกุล', type: 'text' }, { name: 'วันหมดอายุ', type: 'date' }], tier: 'Starter', category: 'admin' },
  { name: 'สัญญาจ้าง / Contract', desc: 'สรุปหัวใจสำคัญจากสัญญาจ้างงาน', columns: [{ name: 'คู่สัญญา', type: 'text' }, { name: 'ตำแหน่ง', type: 'text' }, { name: 'เงินเดือน', type: 'currency' }, { name: 'วันเริ่มงาน', type: 'date' }], tier: 'Pro', category: 'admin', custom_prompt: 'ระบุเงื่อนไขการเลิกจ้าง (ถ้ามี) มาไว้ในส่วนชื่อคอลัมน์ หมายเหตุ' },
  { name: 'ใบรับรองแพทย์ / Medical Certificate', desc: 'สถิติการลาป่วยจากใบรับรองแพทย์', columns: [{ name: 'ชื่อคนไข้', type: 'text' }, { name: 'สถานพยาบาล', type: 'text' }, { name: 'จำนวนวันที่ลา', type: 'number' }, { name: 'ความเห็นแพทย์', type: 'text' }], tier: 'Starter', category: 'admin' },

  // LOGISTICS
  { name: 'ใบส่งของ / Delivery Order', desc: 'ตรวจสอบรายการส่งสินค้า', columns: [{ name: 'เลขที่ใบส่งของ', type: 'text' }, { name: 'ชื่อลูกค้า', type: 'text' }, { name: 'รายการสินค้า', type: 'text' }, { name: 'จำนวน', type: 'number' }], tier: 'Starter', category: 'logistics' },
  { name: 'ใบสั่งซื้อ / Purchase Order', desc: 'สกัดข้อมูลจากใบ PO เพื่อนำไปคีย์เข้าระบบ ERP', columns: [{ name: 'เลขที่ PO', type: 'text' }, { name: 'ผู้ขาย', type: 'text' }, { name: 'วันที่สั่งซื้อ', type: 'date' }, { name: 'ยอดรวม', type: 'currency' }], tier: 'Starter', category: 'logistics' },
  { name: 'Packing List', desc: 'รายละเอียดการบรรจุสินค้า (แบบคอลัมน์เยอะ)', columns: [{ name: 'รหัสสินค้า', type: 'text' }, { name: 'จำนวนกล่อง', type: 'number' }, { name: 'น้ำหนักสุทธิ', type: 'number' }, { name: 'หน่วย', type: 'text' }], tier: 'Pro', category: 'logistics' },

  // AI & CREATIVE
  { name: 'แปลเอกสาร / Translation', desc: 'สกัดข้อมูลพร้อมแปลภาษาไทยเป็นอังกฤษอัตโนมัติ', columns: [{ name: 'หัวข้อหลัก', type: 'text' }, { name: 'เนื้อหาไทย', type: 'text' }, { name: 'Translation (EN)', type: 'text' }], tier: 'Pro', category: 'ai', custom_prompt: 'สกัดหัวข้อและแปลเนื้อหาที่เป็นภาษาไทยให้กลายเป็นภาษาอังกฤษที่สละสลวยที่สุด' },
  { name: 'สรุปใจความสำคัญ / Summary', desc: 'อ่านเนื้อหายาวๆ แล้วสรุปเป็นประเด็นหลัก', columns: [{ name: 'ประเด็นหลัก', type: 'text' }, { name: 'สรุป 1 ประโยค', type: 'text' }, { name: 'สิ่งที่ต้องทำต่อ', type: 'text' }], tier: 'Pro', category: 'ai', custom_prompt: 'สรุปเนื้อหาที่ได้ให้กระชับสไตล์ Bullet Point เพื่อให้อ่านง่ายและรวดเร็วคอลัมน์ "สิ่งที่ต้องทำต่อ" ให้สรุป Action item' },
  { name: 'วิเคราะห์อารมณ์ / Sentiment', desc: 'ประเมินความรู้สึกของลูกค้าจากรีวิวหรือแชท', columns: [{ name: 'ชื่อลูกค้า', type: 'text' }, { name: 'ข้อความรีวิว', type: 'text' }, { name: 'ระดับอารมณ์', type: 'text' }, { name: 'ความเร่งด่วน', type: 'text' }], tier: 'Pro', category: 'ai', custom_prompt: 'วิเคราะห์ว่าข้อความเป็น Positive, Neutral หรือ Negative และระบุความเร่งด่วน (มาก, ปานกลาง, น้อย)' },
]

type Props = { userProfile: UserProfile | null; setView: (v: View) => void; refreshProfile: () => void }

export default function DashboardView({ userProfile, setView, refreshProfile }: Props) {
  const { toast } = useToast()
  const [tab, setTab] = useState<DashTab>('upload')
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [tplName, setTplName] = useState('')
  const [tplDesc, setTplDesc] = useState('')
  const [tplCols, setTplCols] = useState<TemplateColumn[]>([{ name: '', type: 'text' }])
  const [tplCustomPrompt, setTplCustomPrompt] = useState('')
  const [tplGoogleSheetUrl, setTplGoogleSheetUrl] = useState('')
  const [tplHeaderRow, setTplHeaderRow] = useState(1)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [templateCategory, setTemplateCategory] = useState('all')

  // Input state
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [textContent, setTextContent] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [pageCount, setPageCount] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [fileStatuses, setFileStatuses] = useState<('waiting' | 'processing' | 'done' | 'error')[]>([])
  const [result, setResult] = useState<Record<string, unknown>[] | null>(null)
  const [resultMeta, setResultMeta] = useState<{ credits_used: number; credits_remaining: number; tokens_used: number } | null>(null)
  const [docs, setDocs] = useState<Document[]>([])

  const [isDragging, setIsDragging] = useState(false)
  const [filePageCounts, setFilePageCounts] = useState<number[]>([])
  const maxCols = userProfile?.max_columns || 4
  const maxTemplates = userProfile?.max_templates || 3
  const hasGSheet = userProfile?.has_googlesheets || false

  // Team / Org state
  type OrgInvite = { id: string; token: string; expires_at: string; used_at: string | null; used_by_line_user_id: string | null }
  type OrgMember = { id: string; profile_id: string | null; role: string; created_at: string; profiles?: { full_name: string | null; email: string } }
  type LineUserRow = { line_user_id: string; display_name: string | null; created_at: string }
  const [org, setOrg] = useState<{ id: string; name: string; credits: bigint } | null>(null)
  const [orgLoading, setOrgLoading] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [invites, setInvites] = useState<OrgInvite[]>([])
  const [_orgMembers, setOrgMembers] = useState<OrgMember[]>([])
  const [lineUsers, setLineUsers] = useState<LineUserRow[]>([])
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => { if (userProfile?.id) { fetchTemplates(); fetchDocs(); fetchOrg() } }, [userProfile?.id])

  const fetchTemplates = async () => {
    if (!userProfile?.id) return
    const { data } = await supabase.from('extraction_templates').select('*').eq('user_id', userProfile.id).order('created_at', { ascending: false })
    if (data) setTemplates(data as ExtractionTemplate[])
  }

  const fetchDocs = async () => {
    if (!userProfile?.id) return
    const { data } = await supabase.from('documents').select('*').eq('user_id', userProfile.id).order('created_at', { ascending: false }).limit(20)
    if (data) setDocs(data as Document[])
  }

  const fetchOrg = async () => {
    if (!userProfile?.id) return
    setOrgLoading(true)
    try {
      const { data: orgRows, error: orgErr } = await supabase.from('organizations').select('*').eq('owner_id', userProfile.id).order('created_at', { ascending: true }).limit(1)
      if (orgErr) console.error('fetchOrg error:', orgErr)
      const data = orgRows?.[0] ?? null
      if (data) {
        setOrg(data)
        const [{ data: inv }, { data: members }, { data: lu }] = await Promise.all([
          supabase.from('org_invites').select('*').eq('org_id', data.id).order('created_at', { ascending: false }),
          supabase.from('org_members').select('*, profiles(full_name, email)').eq('org_id', data.id),
          supabase.from('line_users').select('line_user_id, display_name, created_at').eq('org_id', data.id),
        ])
        if (inv) setInvites(inv)
        if (members) setOrgMembers(members as OrgMember[])
        if (lu) setLineUsers(lu)
      } else {
        setOrg(null)
      }
    } finally {
      setOrgLoading(false)
    }
  }

  const createOrg = async () => {
    if (!orgName.trim()) { toast('error', 'กรุณาตั้งชื่อองค์กร'); return }
    setOrgLoading(true)
    const { error } = await supabase.from('organizations').insert({ name: orgName.trim(), owner_id: userProfile!.id })
    setOrgLoading(false)
    if (error) {
      // org อาจมีอยู่แล้ว (สร้างอัตโนมัติตอน generate invite) — fetch มาแสดงเลย
      if (error.code === '23505') { fetchOrg(); return }
      toast('error', error.message); return
    }
    setOrgName('')
    toast('success', 'สร้างองค์กรสำเร็จ!')
    fetchOrg()
  }

  const generateInvite = async () => {
    setGeneratingInvite(true)
    try {
      let orgId = org?.id
      if (!orgId) {
        // Auto-create personal org for individual users
        const orgName = userProfile?.email?.split('@')[0] || 'My Account'
        const { data: newOrg, error: orgErr } = await supabase
          .from('organizations')
          .insert({ name: orgName, owner_id: userProfile!.id })
          .select('id')
          .single()
        if (orgErr) { toast('error', orgErr.message); return }
        orgId = newOrg.id
      }
      const { error } = await supabase.from('org_invites').insert({ org_id: orgId, created_by: userProfile!.id })
      if (error) { toast('error', error.message); return }
      toast('success', 'สร้าง code สำเร็จ! คัดลอกแล้วส่งใน Line bot ได้เลย')
      fetchOrg()
    } finally {
      setGeneratingInvite(false)
    }
  }

  const copyInviteLink = (token: string) => {
    navigator.clipboard.writeText(`link ${token}`)
    setCopiedToken(token)
    toast('success', 'คัดลอก code แล้ว! วางใน Line bot ได้เลย')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const addCol = () => { if (tplCols.length >= maxCols) { toast('error', `แพ็กเกจของคุณรองรับสูงสุด ${maxCols} คอลัมน์`); return }; setTplCols([...tplCols, { name: '', type: 'text' }]) }
  const removeCol = (i: number) => setTplCols(tplCols.filter((_, idx) => idx !== i))
  const updateCol = (i: number, field: keyof TemplateColumn, val: string) => { const next = [...tplCols]; next[i] = { ...next[i], [field]: val }; setTplCols(next) }
  const moveCol = (i: number, dir: -1 | 1) => { const j = i + dir; if (j < 0 || j >= tplCols.length) return; const next = [...tplCols]; [next[i], next[j]] = [next[j], next[i]]; setTplCols(next) }

  const saveTemplate = async () => {
    if (!tplName.trim()) { toast('error', 'กรุณาตั้งชื่อ Template'); return }
    const validCols = tplCols.filter(c => c.name.trim())
    if (validCols.length === 0) { toast('error', 'กรุณาเพิ่มคอลัมน์อย่างน้อย 1 อัน'); return }
    if (!editingTemplateId && templates.length >= maxTemplates) { toast('error', `แพ็กเกจของคุณสร้างได้สูงสุด ${maxTemplates} Template`); return }
    setSaving(true)
    if (editingTemplateId) {
      // Update existing
      const { error } = await supabase.from('extraction_templates').update({ name: tplName, description: tplDesc, custom_prompt: tplCustomPrompt, columns: validCols, webhook_url: null, google_sheet_url: tplGoogleSheetUrl || null, header_row_index: tplHeaderRow }).eq('id', editingTemplateId)
      setSaving(false)
      if (error) { toast('error', error.message); return }
      toast('success', 'อัปเดต Template สำเร็จ!')
    } else {
      // Create new
      const { error } = await supabase.from('extraction_templates').insert({ user_id: userProfile!.id, name: tplName, description: tplDesc, custom_prompt: tplCustomPrompt, columns: validCols, webhook_url: null, google_sheet_url: tplGoogleSheetUrl || null, header_row_index: tplHeaderRow })
      setSaving(false)
      if (error) { toast('error', error.message); return }
      toast('success', 'บันทึก Template สำเร็จ!')
    }
    resetBuilder(); fetchTemplates()
  }

  const resetBuilder = () => {
    setShowBuilder(false); setEditingTemplateId(null); setTplName(''); setTplDesc(''); setTplCustomPrompt(''); setTplGoogleSheetUrl(''); setTplHeaderRow(1); setTplCols([{ name: '', type: 'text' }])
  }

  const editTemplate = (t: ExtractionTemplate) => {
    setEditingTemplateId(t.id)
    setTplName(t.name)
    setTplDesc(t.description || '')
    setTplCustomPrompt(t.custom_prompt || '')
    setTplGoogleSheetUrl((t as ExtractionTemplate & { google_sheet_url?: string }).google_sheet_url || '')
    setTplHeaderRow(t.header_row_index || 1)
    setTplCols((t.columns as TemplateColumn[]).length > 0 ? (t.columns as TemplateColumn[]) : [{ name: '', type: 'text' }])
    setShowBuilder(true)
    setTab('templates')
  }

  const usePreset = (preset: typeof PRESETS[0]) => { setEditingTemplateId(null); setTplName(preset.name); setTplDesc(preset.desc); setTplCols(preset.columns.slice(0, maxCols)); setTplCustomPrompt(preset.custom_prompt || ''); setTplGoogleSheetUrl(''); setTplHeaderRow(1); setShowBuilder(true); setTab('templates'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const deleteTemplate = async (id: string) => { const { error } = await supabase.from('extraction_templates').delete().eq('id', id); if (error) toast('error', error.message); else { toast('success', 'ลบ Template แล้ว'); fetchTemplates() } }

  // === AI Processing (supports single file, text, or multi-file queue) ===
  const processSingleFile = async (file: File, session: any, templateId: string, credits: number): Promise<{ data: Record<string, unknown>[]; meta: { credits_used: number; credits_remaining: number; tokens_used: number } }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('page_count', String(credits))
    formData.append('template_id', templateId)
    const res = await fetch(`https://sdnghecdrsukdgbxsjfl.supabase.co/functions/v1/process-document`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` }, body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'ประมวลผลล้มเหลว')
    let parsed = data.extracted_data
    if (typeof parsed === 'string') {
      try {
        let clean = parsed.trim()
        if (clean.startsWith('```')) clean = clean.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()
        parsed = JSON.parse(clean)
      } catch { parsed = [{ raw_text: parsed }] }
    }
    if (!Array.isArray(parsed)) parsed = [parsed]
    return { data: parsed, meta: { credits_used: data.credits_used, credits_remaining: data.credits_remaining, tokens_used: data.tokens_used } }
  }

  const processDocument = async () => {
    if (inputMode === 'file' && uploadFiles.length === 0) { toast('error', 'กรุณาเลือกไฟล์'); return }
    if (inputMode === 'text' && !textContent.trim()) { toast('error', 'กรุณาใส่ข้อความ'); return }
    if (!selectedTemplate) { toast('error', 'กรุณาเลือก Template ก่อนเริ่มประมวลผล'); return }
    if (!userProfile || userProfile.credits < pageCount) { toast('error', `เครดิตไม่เพียงพอ (ต้องการ ${pageCount}, มี ${userProfile?.credits || 0})`); return }
    setProcessing(true); setResult(null); setResultMeta(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('กรุณาเข้าสู่ระบบใหม่')

      if (inputMode === 'text') {
        // Text mode (single)
        const formData = new FormData()
        formData.append('text_content', textContent)
        formData.append('page_count', String(pageCount))
        formData.append('template_id', selectedTemplate)
        const res = await fetch(`https://sdnghecdrsukdgbxsjfl.supabase.co/functions/v1/process-document`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` }, body: formData
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'ประมวลผลล้มเหลว')
        let parsed = data.extracted_data
        if (typeof parsed === 'string') {
          try {
            let clean = parsed.trim()
            if (clean.startsWith('```')) clean = clean.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()
            parsed = JSON.parse(clean)
          } catch { parsed = [{ raw_text: parsed }] }
        }
        if (!Array.isArray(parsed)) parsed = [parsed]
        setResult(parsed)
        setResultMeta({ credits_used: data.credits_used, credits_remaining: data.credits_remaining, tokens_used: data.tokens_used })
        toast('success', `สำเร็จ! ใช้ ${data.credits_used} เครดิต`)
      } else {
        // Multi-file mode
        const statuses: ('waiting' | 'processing' | 'done' | 'error')[] = uploadFiles.map(() => 'waiting' as const)
        setFileStatuses([...statuses])
        let allResults: Record<string, unknown>[] = []
        let totalCreditsUsed = 0
        let lastRemaining = 0
        let totalTokens = 0

        for (let i = 0; i < uploadFiles.length; i++) {
          setProcessingIndex(i)
          statuses[i] = 'processing'
          setFileStatuses([...statuses])
          try {
            const creditsForFile = Math.max(1, (filePageCounts[i] || 1) * 2)
            const resultData = await processSingleFile(uploadFiles[i], session, selectedTemplate, creditsForFile)
            
            // Enrich each row with file and page metadata
            const enriched = resultData.data.map((row, rowIdx) => ({
              _ไฟล์ต้นทาง: uploadFiles[i].name,
              _หน้า: `${rowIdx + 1} / ${resultData.data.length}`,
              ...row
            }))
            
            allResults = [...allResults, ...enriched]
            totalCreditsUsed += resultData.meta.credits_used
            lastRemaining = resultData.meta.credits_remaining
            totalTokens += resultData.meta.tokens_used
            statuses[i] = 'done'
          } catch {
            statuses[i] = 'error'
          }
          setFileStatuses([...statuses])
        }
        setProcessingIndex(-1)
        setResult(allResults)
        setResultMeta({ credits_used: totalCreditsUsed, credits_remaining: lastRemaining, tokens_used: totalTokens })
        const doneCount = statuses.filter(s => s === 'done').length
        toast('success', `เสร็จสิ้น! ประมวลผลสำเร็จ ${doneCount}/${uploadFiles.length} ไฟล์ (ใช้ ${totalCreditsUsed} เครดิต)`)
      }
      refreshProfile(); fetchDocs()
    } catch (err: unknown) { toast('error', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด') }
    finally { setProcessing(false); setProcessingIndex(-1) }
  }

  const retryFile = async (index: number) => {
    if (!uploadFiles[index] || processing) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { toast('error', 'กรุณาเข้าสู่ระบบใหม่'); return }
    if (!selectedTemplate) { toast('error', 'กรุณาเลือก Template ก่อน'); return }

    setProcessing(true)
    const statuses = [...fileStatuses]
    statuses[index] = 'processing'
    setFileStatuses(statuses)

    try {
      const creditsForFile = Math.max(1, (filePageCounts[index] || 1) * 2)
      const res = await processSingleFile(uploadFiles[index], session, selectedTemplate, creditsForFile)
      
      const enriched = res.data.map((row, rowIdx) => ({
        _ไฟล์ต้นทาง: uploadFiles[index].name,
        _หน้า: `${rowIdx + 1} / ${res.data.length}`,
        ...row
      }))
      
      setResult(prev => prev ? [...prev, ...enriched] : enriched)
      
      setResultMeta(prev => ({
        credits_used: (prev?.credits_used || 0) + res.meta.credits_used,
        credits_remaining: res.meta.credits_remaining,
        tokens_used: (prev?.tokens_used || 0) + res.meta.tokens_used
      }))

      statuses[index] = 'done'
      toast('success', `สำเร็จ! ไฟล์ ${uploadFiles[index].name}`)
      refreshProfile(); fetchDocs()
    } catch (err: any) {
      statuses[index] = 'error'
      toast('error', err.message || 'ล้มเหลว')
    } finally {
      setFileStatuses([...statuses])
      setProcessing(false)
    }
  }

  const retryAllFailed = async () => {
    const failedIndices = fileStatuses.map((s, i) => s === 'error' ? i : -1).filter(i => i !== -1)
    if (failedIndices.length === 0) return
    for (const idx of failedIndices) {
      await retryFile(idx)
    }
  }

  const exportCSV = (data: Record<string, unknown>[]) => {
    if (!data.length) return
    const keys = Object.keys(data[0])
    const csv = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `doc-reader-export-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast('success', 'ดาวน์โหลด CSV เรียบร้อย!')
  }

  const [detectedPages, setDetectedPages] = useState(0)

  const countPdfPages = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const countMatches = content.match(/\/Count\s+(\d+)/g)
        if (countMatches) {
          const counts = countMatches.map(m => { const num = m.match(/\d+/); return num ? parseInt(num[0]) : 0 })
          const maxCount = Math.max(...counts)
          if (maxCount > 0) { resolve(maxCount); return }
        }
        const pageMatches = content.match(/\/Type\s*\/Page(?!s)\b/g)
        resolve(pageMatches ? pageMatches.length : 1)
      }
      reader.readAsText(file)
    })
  }

  const handleFilesSelect = async (files: FileList) => {
    const fileArray = Array.from(files)
    setUploadFiles(fileArray)
    setFileStatuses(fileArray.map(() => 'waiting'))
    setResult(null)

    let totalPages = 0
    const counts: number[] = []
    for (const file of fileArray) {
      let pages = 1
      if (file.type === 'application/pdf') {
        pages = await countPdfPages(file)
      }
      counts.push(pages)
      totalPages += pages
    }
    setDetectedPages(totalPages)
    setFilePageCounts(counts)
    setPageCount(totalPages * 2)
  }

  const removeFile = (index: number) => {
    const newFiles = uploadFiles.filter((_, i) => i !== index)
    const newCounts = filePageCounts.filter((_, i) => i !== index)
    setUploadFiles(newFiles)
    setFilePageCounts(newCounts)
    setFileStatuses(newFiles.map(() => 'waiting'))
    const total = newCounts.reduce((acc, c) => acc + c, 0)
    setDetectedPages(total)
    setPageCount(total > 0 ? total * 2 : 2)
    if (newFiles.length === 0) { setResult(null); setResultMeta(null) }
  }


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files)
    }
  }

  const handleTextChange = (text: string) => {
    setTextContent(text)
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setPageCount(Math.max(1, Math.ceil(words / 300)) * 2)
  }

  const tabs: { key: DashTab; label: string; icon: React.ReactNode }[] = [
    { key: 'upload', label: 'อัปโหลด', icon: <Upload size={16} /> },
    { key: 'templates', label: 'Templates', icon: <Table size={16} /> },
    { key: 'history', label: 'ประวัติ', icon: <FileText size={16} /> },
    { key: 'team', label: 'ทีม', icon: <Users size={16} /> },
    { key: 'howto', label: 'วิธีใช้งาน', icon: <HelpCircle size={16} /> },
  ]

  const handleTabChange = (key: DashTab) => {
    setTab(key)
    if (key === 'team') fetchOrg()
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 md:pb-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-600 mr-2">ระบบออนไลน์</span>
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-full shadow-sm ${
                userProfile?.tier === 'pro' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                userProfile?.tier === 'starter plus' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                userProfile?.tier === 'starter' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {userProfile?.tier || 'Free Plan'}
              </span>
            </div>
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">จัดการเอกสาร</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><Coins size={20} /></div>
              <div><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">เครดิต</p><p className="text-xl font-black text-slate-900 font-headline leading-none">{userProfile?.credits?.toLocaleString() || 0}</p></div>
            </div>
            <button onClick={() => { setView('landing'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100) }} className="h-14 px-5 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm font-bold shadow-lg shadow-indigo-100"><Plus size={16} /> เติมเครดิต</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* ========== Upload Tab ========== */}
        {tab === 'upload' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              {/* Input Mode Toggle */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
                <button onClick={() => { setInputMode('file'); setResult(null) }} className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${inputMode === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>ไฟล์เอกสาร</button>
                <button onClick={() => { setInputMode('text'); setResult(null) }} className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${inputMode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>พิมพ์ข้อความ</button>
              </div>

              {inputMode === 'file' ? (
                <div className="space-y-3">
                  {/* Drop Zone */}
                  <div 
                    onClick={() => fileRef.current?.click()} 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group ${
                      isDragging ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50/50' : 
                      uploadFiles.length > 0 ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-white bg-white/50'
                    }`}
                  >
                    <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple onChange={e => { if (e.target.files && e.target.files.length > 0) handleFilesSelect(e.target.files) }} />
                    <div className={`w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center transition-all ${isDragging ? 'scale-110 text-indigo-600 bg-indigo-100' : 'text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50'}`}>{uploadFiles.length > 0 ? <Files size={22} /> : <Upload size={22} />}</div>
                    <p className="text-sm font-bold text-slate-600 group-hover:text-slate-700 text-center">{uploadFiles.length > 0 ? `เลือกไฟล์แล้ว ${uploadFiles.length} ไฟล์ (กดเพื่อเปลี่ยน)` : 'ลากไฟล์วางที่นี่ หรือคลิกเพื่อเลือก'}</p>
                    <p className="text-[10px] text-slate-400 font-bold">เลือกได้หลายไฟล์พร้อมกัน (Ctrl+Click)</p>
                  </div>

                  {/* Supported Files Info */}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-[10px] text-blue-700 font-bold leading-relaxed">
                      <span className="font-black">ไฟล์ที่รองรับ:</span> PDF, JPG, JPEG, PNG, WEBP<br/>
                      <span className="font-black">ขนาดสูงสุด:</span> 5 MB ต่อไฟล์ · <span className="font-black">PDF:</span> แนะนำไม่เกิน 30 หน้า
                    </div>
                  </div>

                  {/* File Queue */}
                  {uploadFiles.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {uploadFiles.map((file, i) => (
                        <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          fileStatuses[i] === 'done' ? 'bg-emerald-50 border-emerald-200' :
                          fileStatuses[i] === 'processing' ? 'bg-indigo-50 border-indigo-200' :
                          fileStatuses[i] === 'error' ? 'bg-rose-50 border-rose-200' :
                          'bg-white border-slate-200'
                        }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            fileStatuses[i] === 'done' ? 'bg-emerald-100 text-emerald-600' :
                            fileStatuses[i] === 'processing' ? 'bg-indigo-100 text-indigo-600' :
                            fileStatuses[i] === 'error' ? 'bg-rose-100 text-rose-600' :
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {fileStatuses[i] === 'done' ? <CheckCircle2 size={14} /> :
                             fileStatuses[i] === 'processing' ? <Loader2 size={14} className="animate-spin" /> :
                             fileStatuses[i] === 'error' ? <AlertCircle size={14} /> :
                             <FileText size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                              {filePageCounts[i] > 0 && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black">{filePageCounts[i]} {file.type === 'application/pdf' ? 'หน้า' : 'Cr'}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-auto">
                            {fileStatuses[i] === 'error' && !processing && (
                              <button onClick={(e) => { e.stopPropagation(); retryFile(i) }} className="text-indigo-600 hover:text-indigo-800 p-1 bg-white rounded-lg border border-slate-200 shadow-sm" title="ลองใหม่เฉพาะใบนี้"><RotateCcw size={14} /></button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); removeFile(i) }} className="text-slate-300 hover:text-rose-500 p-1 flex-shrink-0" title="ลบออกจากคิว"><X size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <textarea value={textContent} onChange={e => handleTextChange(e.target.value)} placeholder="วางข้อความยาวๆ ที่นี่... (เช่น อีเมล, บทความ, แชท)" className="w-full h-48 bg-white border-2 border-slate-200 rounded-3xl p-5 text-sm focus:border-indigo-400 outline-none transition-all resize-none font-body" />
                    <div className="absolute bottom-4 right-5 flex gap-3 text-[10px] font-bold text-slate-600">
                      <span>{textContent.length.toLocaleString()} ตัวอักษร</span>
                      <span>{textContent.trim() ? textContent.trim().split(/\s+/).length : 0} คำ</span>
                    </div>
                  </div>
                </div>
              )}

              {(uploadFiles.length > 0 || (inputMode === 'text' && textContent.trim())) && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-fadeUp">
                  {templates.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">เลือก Template</p>
                      <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className={`w-full border rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${!selectedTemplate ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-slate-50 border-slate-200'}`}>
                        <option value="">-- กรุณาเลือก Template เสมอ --</option>
                        {templates.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.name} ({(t.columns as TemplateColumn[]).length} คอลัมน์)</option>)}
                      </select>
                      {!selectedTemplate && <p className="text-[9px] text-rose-400 mt-1 font-bold animate-pulse">* จำเป็นต้องเลือก Template เพื่อเริ่มระบบ</p>}
                    </div>
                  )}
                  {inputMode === 'file' && detectedPages > 0 && (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <span className="text-xs font-bold text-indigo-700">จำนวนหน้าที่ตรวจพบ</span>
                      <span className="text-lg font-black text-indigo-600">{detectedPages} <span className="text-xs font-bold">หน้า</span></span>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">จำนวนเครดิตที่ต้องการใช้</p>
                    <input type="number" min={1} max={100} value={pageCount} onChange={e => setPageCount(Math.max(1, Number(e.target.value)))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                    <p className="text-[9px] text-slate-400 mt-1 font-bold">ปรับได้เอง (2 เครดิต = 1 หน้า, ระบบจะนับหน้าอัตโนมัติ)</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-xs font-bold text-amber-700">เครดิตที่จะหัก</span>
                    <span className="text-lg font-black text-amber-600">{pageCount} <span className="text-xs font-bold">Cr</span></span>
                  </div>
                  <button onClick={processDocument} disabled={processing} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-100">
                    {processing ? <><Loader2 className="animate-spin" size={18} /> กำลังประมวลผล...</> : <><Zap size={18} /> เริ่มประมวลผล</>}
                  </button>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              {processing ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center animate-pulse">
                  <Loader2 size={48} className="text-indigo-400 animate-spin mb-4" />
                  <p className="text-sm font-bold text-slate-500">
                    {uploadFiles.length > 1 ? `กำลังประมวลผลไฟล์ ${processingIndex + 1} / ${uploadFiles.length}` : 'AI กำลังอ่านเอกสาร...'}
                  </p>
                  {uploadFiles.length > 1 && processingIndex >= 0 && (
                    <p className="text-xs text-indigo-600 font-bold mt-1 truncate max-w-xs">{uploadFiles[processingIndex]?.name}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">อาจใช้เวลา 5-15 วินาทีต่อไฟล์</p>
                  {uploadFiles.length > 1 && (
                    <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${((processingIndex + 1) / uploadFiles.length) * 100}%` }} />
                    </div>
                  )}
                </div>
              ) : result ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 animate-fadeUp">
                  {resultMeta && (
                    <div className="flex items-center gap-4 mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">ใช้ {resultMeta.credits_used} เครดิต · เหลือ {resultMeta.credits_remaining}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">ผลลัพธ์ ({result.length} รายการ)</p>
                      <div className="flex gap-2">
                        {fileStatuses.includes('error') && (
                          <button onClick={retryAllFailed} disabled={processing} className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-100"><RotateCcw size={14} /> Retry ทั้งหมด ({fileStatuses.filter(s => s === 'error').length})</button>
                        )}
                        <button onClick={() => exportCSV(result)} className="flex items-center gap-2 bg-slate-100 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-200"><Download size={14} /> CSV</button>
                        {hasGSheet && (
                          <button onClick={() => setTab('howto')} className="flex items-center gap-2 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-700 animate-fadeUp"><ExternalLink size={14} /> Sync Google Sheet</button>
                        )}
                      </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-slate-50">{Object.keys(result[0] || {}).map(k => <th key={k} className="text-left px-3 py-2 font-bold text-slate-500 border-b border-slate-200 whitespace-nowrap">{k}</th>)}</tr></thead>
                      <tbody>{result.map((row, i) => (<tr key={i} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">{Object.values(row).map((v, j) => <td key={j} className="px-3 py-2 text-slate-700 whitespace-nowrap">{String(v ?? '')}</td>)}</tr>))}</tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                  <FileText size={48} className="text-slate-200 mb-4" />
                  <p className="text-sm font-bold text-slate-600">ยังไม่มีเอกสารที่ประมวลผล</p>
                  <p className="text-xs text-slate-500 mt-1 font-bold">อัปโหลดไฟล์และกด "เริ่มประมวลผล" เพื่อเริ่มต้น</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== Templates Tab ========== */}
        {tab === 'templates' && (
          <div>
            {!showBuilder ? (
              <>
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">🚀 เริ่มต้นจาก Template สำเร็จรูป</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {[
                        { id: 'all', name: 'ทั้งหมด', icon: <Files size={12} /> },
                        { id: 'finance', name: 'บัญชี/การเงิน', icon: <Coins size={12} /> },
                        { id: 'admin', name: 'ธุรการ/บุคคล', icon: <UserCircle2 size={12} /> },
                        { id: 'logistics', name: 'ขนส่ง/คลังสินค้า', icon: <Globe size={12} /> },
                        { id: 'ai', name: 'งาน AI/วิเคราะห์', icon: <Zap size={12} /> }
                      ].map(cat => (
                        <button key={cat.id} onClick={() => setTemplateCategory(cat.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border ${templateCategory === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                          {cat.icon} {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {PRESETS.filter(p => templateCategory === 'all' || p.category === templateCategory).map((p, i) => (
                      <button key={i} onClick={() => usePreset(p)} className="bg-white border border-slate-200 rounded-3xl p-6 text-left hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group relative overflow-hidden animate-fadeUp" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-headline font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{p.name}</h4>
                          <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full flex-shrink-0 ${p.tier === 'Pro' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>{p.tier}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-4 line-clamp-2 font-bold leading-relaxed">{p.desc}</p>
                        <div className="flex gap-1.5 flex-wrap mb-4">{p.columns.slice(0, 3).map((c, ci) => <span key={ci} className="text-[9px] bg-slate-50 text-slate-400 px-2 py-1 rounded-lg font-black uppercase tracking-widest border border-slate-100">{c.name}</span>)}{p.columns.length > 3 && <span className="text-[9px] text-slate-300 font-bold">+{p.columns.length - 3}</span>}</div>
                        {p.custom_prompt && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
                            <Zap size={10} fill="currentColor" /> Expert Prompt Included
                          </div>
                        )}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-[40px] -mr-12 -mt-12 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest">📋 Templates ของคุณ ({templates.length}/{maxTemplates})</p>
                  <button onClick={() => setShowBuilder(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all"><Plus size={14} /> สร้างใหม่</button>
                </div>
                {templates.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center"><Table size={40} className="text-slate-200 mx-auto mb-3" /><p className="text-sm font-bold text-slate-400">ยังไม่มี Template</p></div>
                ) : (
                  <div className="grid gap-4">{templates.map(t => (
                    <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-sm transition-all">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900">{t.name}</h4>
                        {t.description && <p className="text-xs text-slate-500 mt-0.5 font-bold">{t.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {t.webhook_url && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Active Webhook</span>}
                          {t.custom_prompt && <p className="text-[10px] text-amber-600 font-bold truncate">💡 Prompt: {t.custom_prompt}</p>}
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">{(t.columns as TemplateColumn[]).map((c, ci) => <span key={ci} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{c.name}</span>)}</div>
                      </div>
                      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                        <button onClick={() => editTemplate(t)} className="text-slate-300 hover:text-indigo-600 transition-colors p-2" title="แก้ไข"><Pencil size={16} /></button>
                        <button onClick={() => deleteTemplate(t.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2" title="ลบ"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}</div>
                )}
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 animate-fadeUp">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-headline font-black text-slate-900">{editingTemplateId ? '✏️ แก้ไข Template' : '➕ สร้าง Template ใหม่'}</h3>
                    {editingTemplateId && <p className="text-[10px] text-amber-600 font-bold mt-0.5">กำลังแก้ไข Template ที่มีอยู่</p>}
                  </div>
                  <button onClick={resetBuilder} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="space-y-4 mb-6">
                  <div><label className="block text-xs font-bold uppercase tracking-widest text-slate-700 mb-1">ชื่อ Template</label><input value={tplName} onChange={e => setTplName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base font-black text-slate-900 placeholder:text-slate-400" placeholder="เช่น ใบเสร็จค่าไฟฟ้า" /></div>
                  <div><label className="block text-xs font-bold uppercase tracking-widest text-slate-700 mb-1">คำอธิบาย (ไม่บังคับ)</label><input value={tplDesc} onChange={e => setTplDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400" placeholder="อธิบายว่า Template นี้ใช้กับเอกสารประเภทไหน" /></div>
                  {hasGSheet && (
                    <>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start">
                        <span className="text-lg flex-shrink-0">📋</span>
                        <div>
                          <p className="text-xs font-black text-emerald-800 mb-1">ก่อนเชื่อม — แชร์ชีตให้ P-Admin ก่อนนะครับ</p>
                          <p className="text-xs text-emerald-700 leading-relaxed">
                            เปิด Google Sheet → กด Share → ใส่อีเมล{' '}
                            <span
                              className="font-black bg-white border border-emerald-300 px-1.5 py-0.5 rounded text-emerald-800 cursor-pointer select-all"
                              onClick={() => { navigator.clipboard.writeText(PADMIN_SHEETS_EMAIL); toast('success', 'คัดลอกอีเมลแล้ว!') }}
                              title="คลิกเพื่อคัดลอก"
                            >{PADMIN_SHEETS_EMAIL}</span>{' '}
                            → เลือก <strong>Editor</strong> → Send
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-700 mb-1">URL ของ Google Sheet ที่ต้องการ Sync</label>
                          <input value={tplGoogleSheetUrl} onChange={e => setTplGoogleSheetUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base font-black text-emerald-700 placeholder:text-emerald-300" placeholder="https://docs.google.com/spreadsheets/d/..." />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-700 mb-1">ข้อมูลเริ่มที่แถวไหน (ปกติคือ 2)</label>
                          <input type="number" min="1" value={tplHeaderRow} onChange={e => setTplHeaderRow(parseInt(e.target.value)||1)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base font-black text-slate-900" />
                          <p className="text-[10px] text-slate-400 font-bold mt-1">แถว 1 = หัวตาราง, แถว 2 = ข้อมูลแรก</p>
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-700 mb-1">คำสั่งพิเศษ หรือบริบทเพิ่มเติมให้ AI (Optional)</label>
                    <textarea value={tplCustomPrompt} onChange={e => setTplCustomPrompt(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400" placeholder="ตัวอย่าง: รหัสสาขาต้องขึ้นต้นด้วย INC เสมอ, แปลงวันที่ให้เป็นรูปแบบ YYYY-MM-DD" />
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-700">คอลัมน์ที่ต้องการ ({tplCols.length}/{maxCols})</label>
                    <button onClick={addCol} disabled={tplCols.length >= maxCols} className="text-sm font-bold text-indigo-700 hover:text-indigo-900 disabled:text-slate-400 flex items-center gap-1"><Plus size={14} /> เพิ่มคอลัมน์</button>
                  </div>
                  <div className="space-y-2">
                    {tplCols.map((col, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 border border-slate-200">
                        <span className="text-xs font-black text-slate-400 w-6 text-center">{i + 1}</span>
                        <input value={col.name} onChange={e => updateCol(i, 'name', e.target.value)} className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-black text-slate-900 placeholder:text-slate-300" placeholder="ชื่อคอลัมน์" />
                        <select value={col.type} onChange={e => updateCol(i, 'type', e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm font-bold text-slate-900 w-28">
                          <option value="text">ข้อความ</option><option value="number">ตัวเลข</option><option value="date">วันที่</option><option value="currency">จำนวนเงิน</option>
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
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} {editingTemplateId ? 'อัปเดต Template' : 'บันทึก Template'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========== History Tab ========== */}
        {tab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-headline font-black text-slate-900">📑 ประวัติและการใช้เครดิต</h3>
                <p className="text-xs text-slate-500 font-bold">บันทึกรายการที่คุณเคยประมวลผลไว้</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Coins size={20} /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ใช้ไปทั้งหมด (รอบนี้)</p>
                   <p className="text-lg font-black text-slate-900">{docs.reduce((acc, d) => acc + (d.page_count || 0), 0)} <span className="text-xs">Cr</span></p>
                </div>
              </div>
            </div>
            
            {docs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center"><FileText size={48} className="text-slate-200 mx-auto mb-3" /><p className="text-sm font-bold text-slate-400">ยังไม่มีประวัติการประมวลผล</p></div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-6 py-4 font-black text-slate-500 text-[10px] uppercase tracking-widest">วัน-เวลา</th>
                      <th className="text-left px-6 py-4 font-black text-slate-500 text-[10px] uppercase tracking-widest">ไฟล์ / รายการ</th>
                      <th className="text-center px-6 py-4 font-black text-slate-500 text-[10px] uppercase tracking-widest">สถานะ</th>
                      <th className="text-right px-6 py-4 font-black text-slate-500 text-[10px] uppercase tracking-widest">จำนวนเครดิต</th>
                      <th className="text-center px-6 py-4 font-black text-slate-500 text-[10px] uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {docs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-400">{new Date(doc.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-sm truncate max-w-xs">{doc.original_filename || doc.filename}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{doc.filename === 'Text Input' ? 'Direct Text' : 'File Upload'}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${doc.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : doc.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-slate-900 text-sm">-{doc.page_count || 0}</span> <span className="text-[10px] font-bold text-slate-400">Cr</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                             {doc.status === 'completed' && doc.data && (
                               <button onClick={() => exportCSV(doc.data as unknown as Record<string, unknown>[])} className="text-slate-400 hover:text-indigo-600 p-2 transition-colors" title="Download CSV"><Download size={16} /></button>
                             )}
                             <button onClick={async () => { if(confirm('ต้องการลบประวัตินี้หรือไม่?')) { const {error} = await supabase.from('documents').delete().eq('id', doc.id); if(!error) fetchDocs() } }} className="text-slate-300 hover:text-rose-500 p-2 transition-colors" title="Delete History"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }</div>
        )}

        {/* ========== Team Tab ========== */}
        {tab === 'team' && (
          <div className="space-y-6">
            {orgLoading ? (
              <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
            ) : !org ? (
              /* No org yet — create one */
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Building2 size={28} className="text-indigo-500" /></div>
                <h2 className="text-xl font-black text-slate-900 mb-2">สร้างร้านหรือทีมของคุณ</h2>
                <p className="text-sm text-slate-500 mb-6">ตั้งชื่อร้านหรือทีม เพื่อแชร์เครดิตและเชิญสมาชิกเข้า Line Bot</p>
                <div className="flex gap-2">
                  <input value={orgName} onChange={e => setOrgName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createOrg()} placeholder="เช่น ร้าน ABC, ทีม Ops, บริษัท XYZ" className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  <button onClick={createOrg} disabled={orgLoading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"><Plus size={15} /> สร้าง</button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Org Info + Invite Generator */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Building2 size={20} className="text-indigo-500" /></div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">ร้าน / ทีม</p>
                        <p className="text-lg font-black text-slate-900">{org.name}</p>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100 mb-4" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-wider mb-1">เครดิตองค์กร</p>
                        <p className="text-2xl font-black text-slate-900 font-headline">{Number(org.credits).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-black uppercase tracking-wider mb-1">สมาชิก Line</p>
                        <p className="text-2xl font-black text-slate-900 font-headline">{lineUsers.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Connect own Line account */}
                  <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">💬</span>
                      <h3 className="font-black text-indigo-900 text-sm uppercase tracking-wider">เชื่อม Line Account ของฉัน</h3>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">ทำครั้งเดียว — เพื่อใช้งาน Line Bot ในชื่อของคุณ</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black flex-shrink-0 mt-0.5">1</span>
                        <span>กด <strong>สร้าง Invite Link</strong> ด้านล่าง แล้ว copy code</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black flex-shrink-0 mt-0.5">2</span>
                        <span>เปิด Line แล้วค้นหา <strong>@P-Admin</strong> (หรือ add ไว้แล้ว)</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black flex-shrink-0 mt-0.5">3</span>
                        <span>วาง code แล้วส่ง — ระบบเชื่อมบัญชีให้อัตโนมัติ</span>
                      </div>
                    </div>
                  </div>

                  {/* Generate Invite */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <UserPlus size={16} className="text-indigo-500" />
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">เชิญสมาชิกทีม</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">สร้าง code แชร์ให้ทีม — แต่ละ code ใช้ได้ครั้งเดียว หมดอายุใน 7 วัน</p>
                    <button onClick={generateInvite} disabled={generatingInvite} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {generatingInvite ? <Loader2 size={15} className="animate-spin" /> : <Link size={15} />}
                      สร้าง Invite Link ใหม่
                    </button>

                    {/* Invite list */}
                    {invites.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {invites.slice(0, 5).map(inv => {
                          const expired = new Date(inv.expires_at) < new Date()
                          const used = !!inv.used_at
                          return (
                            <div key={inv.id} className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${used ? 'bg-slate-50 border-slate-100 opacity-60' : expired ? 'bg-red-50 border-red-100 opacity-60' : 'bg-emerald-50 border-emerald-100'}`}>
                              <code className="flex-1 font-mono text-slate-700 truncate">link {inv.token.slice(0, 12)}…</code>
                              <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${used ? 'bg-slate-200 text-slate-500' : expired ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                {used ? 'ใช้แล้ว' : expired ? 'หมดอายุ' : 'ใช้ได้'}
                              </span>
                              {!used && !expired && (
                                <button onClick={() => copyInviteLink(inv.token)} className="text-indigo-500 hover:text-indigo-700">
                                  {copiedToken === inv.token ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Members */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={16} className="text-indigo-500" />
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">สมาชิกใน Line</h3>
                  </div>
                  {lineUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Users size={20} className="text-slate-300" /></div>
                      <p className="text-sm text-slate-400">ยังไม่มีสมาชิก</p>
                      <p className="text-xs text-slate-400 mt-1">สร้าง invite link แล้วแชร์ใน Line group</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lineUsers.map(lu => (
                        <div key={lu.line_user_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <UserCircle2 size={16} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{lu.display_name || 'ไม่ทราบชื่อ'}</p>
                            <p className="text-xs text-slate-400 truncate font-mono">{lu.line_user_id.slice(0, 20)}…</p>
                          </div>
                          <p className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(lu.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== How-to Tab ========== */}
        {tab === 'howto' && <HowToGuide />}
      </div>
    </div>
  )
}

/* ===== How-to Guide Component ===== */
function HowToGuide() {
  const [guideTab, setGuideTab] = useState<'csv' | 'sheets'>('csv')
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
        <button onClick={() => setGuideTab('csv')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${guideTab === 'csv' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Download size={14} className="inline mr-2" />Export CSV</button>
        <button onClick={() => setGuideTab('sheets')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${guideTab === 'sheets' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><ExternalLink size={14} className="inline mr-2" />Google Sheets</button>
      </div>

      {guideTab === 'csv' ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-lg font-headline font-black text-slate-900 mb-2">📥 วิธี Export ข้อมูลเป็น CSV</h3>
          <p className="text-sm text-slate-700 mb-6 font-bold">ดาวน์โหลดข้อมูลที่ AI สกัดได้เป็นไฟล์ CSV เพื่อเปิดใน Excel หรือโปรแกรมตารางอื่นๆ</p>
          <div className="space-y-6">
            {[
              { step: 1, title: 'อัปโหลดเอกสาร', desc: 'ไปที่แท็บ "อัปโหลด" แล้วลากไฟล์ PDF หรือรูปภาพวางลงในพื้นที่อัปโหลด', images: [] },
              { step: 2, title: 'เลือก Template และใส่คำสั่งพิเศษ (Prompt)', desc: 'คุณสามารถสร้าง Template ใหม่เพื่อกำหนดชื่อคอลัมน์ และสามารถใส่ "คำสั่งพิเศษให้ AI (Prompt)" เพื่อสอน AI ให้หารูปแบบเฉพาะที่คุณต้องการได้ (เช่น รหัสต้องขึ้นต้นด้วย INC)', images: [] },
              { step: 3, title: 'กด "เริ่มประมวลผล"', desc: 'ระบบ AI จะอ่านเอกสารและสกัดข้อมูลตามคอลัมน์ที่คุณกำหนด (ใช้เวลา 5-10 วินาที/หน้า)', images: [] },
              { step: 4, title: 'ดาวน์โหลด CSV', desc: 'เมื่อเสร็จแล้ว กดปุ่ม "Download CSV" เพื่อดาวน์โหลดไฟล์ เปิดได้ทันทีใน Excel', images: [] },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm flex-shrink-0">{s.step}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-bold">{s.desc}</p>
                  {s.images && s.images.length > 0 && (
                    <div className="mt-3 flex gap-3 flex-wrap">
                      {s.images.map((img, i) => (
                        <img key={i} src={img} alt={`Step ${s.step}`} onClick={() => setLightboxImage(img)} className="h-24 w-auto rounded-lg border border-slate-200 cursor-zoom-in hover:opacity-80 transition-opacity shadow-sm" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeUp">

          {/* Steps */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <h3 className="text-lg font-headline font-black text-slate-900 mb-1">📊 วิธีเชื่อมต่อ Google Sheets</h3>
            <p className="text-sm text-slate-500 font-bold mb-6">ข้อมูลจะ sync เข้าชีตของคุณอัตโนมัติทุกครั้งที่แปลงเอกสาร ไม่ต้อง copy-paste เอง</p>

            <div className="space-y-8">

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm flex-shrink-0">1</div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 text-sm mb-1">สร้าง Google Sheet และตั้งหัวตาราง</h4>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed mb-1">
                    เปิด <span className="text-emerald-700 font-black">Google Sheets</span> แล้วสร้างไฟล์ใหม่ หรือใช้ไฟล์ที่มีอยู่แล้วก็ได้ครับ<br/>
                    ในแถวแรก ใส่ชื่อคอลัมน์ให้ตรงกับที่ตั้งไว้ใน Template เช่น "วันที่", "ยอดรวม", "เลขที่ใบแจ้งหนี้"
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">💡 ชื่อคอลัมน์ต้องตรงกับใน Template ระบบถึงจะ sync ได้ถูกต้องครับ</p>
                  {/* รูป: หน้า Google Sheet ที่มีหัวตารางแถวแรก */}
                  <div className="mt-3 h-28 w-64 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                    📷 รูปตัวอย่าง Google Sheet<br/>หัวตาราง (จะใส่รูปจริงทีหลัง)
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm flex-shrink-0">2</div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 text-sm mb-1">แชร์ชีตให้ P-Admin เข้าถึงได้</h4>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed mb-3">
                    กดปุ่ม <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-black text-[10px]">Share</span> มุมขวาบน → ช่อง "Add people" ให้ใส่อีเมลด้านล่าง → เปลี่ยนสิทธิ์เป็น <strong>Editor</strong> → กด Send
                  </p>
                  <div
                    className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-emerald-100 transition-colors group"
                    onClick={() => { navigator.clipboard.writeText(PADMIN_SHEETS_EMAIL); }}
                    title="คลิกเพื่อคัดลอก"
                  >
                    <span className="font-black text-emerald-800 text-sm select-all">{PADMIN_SHEETS_EMAIL}</span>
                    <Copy size={12} className="text-emerald-500 group-hover:text-emerald-700 flex-shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-2">คลิกที่อีเมลด้านบนเพื่อคัดลอกได้เลยครับ</p>
                  {/* รูป: หน้า Share dialog ของ Google Sheet */}
                  <div className="mt-3 h-28 w-64 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                    📷 รูปหน้า Share → ใส่อีเมล<br/>(จะใส่รูปจริงทีหลัง)
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm flex-shrink-0">3</div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 text-sm mb-1">นำ URL ของชีตมาใส่ใน Template</h4>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed mb-1">
                    คัดลอก URL ของ Google Sheet จาก address bar ของ browser → กลับมาที่ P-Admin → แท็บ <strong>Templates</strong> → กด "แก้ไข" Template ที่ต้องการ → วาง URL ในช่อง "URL ของ Google Sheet" → กดบันทึก
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">URL จะมีหน้าตาแบบนี้: <span className="text-slate-500">https://docs.google.com/spreadsheets/d/...</span></p>
                  {/* รูป: Template editor ที่มีช่อง Google Sheet URL */}
                  <div className="mt-3 h-28 w-64 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                    📷 รูปช่อง URL ใน Template<br/>(จะใส่รูปจริงทีหลัง)
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Result preview */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
            <h4 className="font-bold text-emerald-900 text-sm mb-3">✨ ผลลัพธ์หลังตั้งค่าเสร็จ</h4>
            <div className="relative group cursor-zoom-in max-w-md" onClick={() => setLightboxImage('/guide/gsheet-result.jpg')}>
              <img src="/guide/gsheet-result.jpg" alt="ตัวอย่างผลลัพธ์ใน Google Sheet" className="w-full h-auto bg-emerald-100 rounded-lg border border-emerald-200 transition-all shadow-sm group-hover:shadow-md" />
              <div className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/80 p-2 rounded-full shadow-lg text-slate-700 font-bold text-xs flex items-center gap-1"><Plus size={14} /> คลิกเพื่อขยาย</div>
              </div>
            </div>
            <p className="text-[10px] text-emerald-700 font-bold mt-3 leading-relaxed">
              ทุกครั้งที่แปลงเอกสาร ข้อมูลจะไป append ต่อท้ายชีตของคุณอัตโนมัติ ไม่ต้อง export หรือ copy-paste เองครับ
            </p>
          </div>

          {/* FAQ */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
            <h4 className="font-bold text-slate-700 text-sm">❓ คำถามที่พบบ่อย</h4>
            <div>
              <p className="text-xs font-black text-slate-700">ข้อมูลจะเข้าชีตเมื่อไหร่?</p>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-0.5">ทันทีหลังจากระบบแปลงเอกสารเสร็จครับ ทั้งจาก webapp และจาก Line Bot</p>
            </div>
            <div>
              <p className="text-xs font-black text-slate-700">ลืม share ให้อีเมล P-Admin จะเกิดอะไรขึ้น?</p>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-0.5">ระบบจะแปลงเอกสารได้ปกติ แต่ข้อมูลจะไม่เข้า Google Sheet ครับ ให้กลับไป Share แล้วลองใหม่ได้เลย</p>
            </div>
            <div>
              <p className="text-xs font-black text-slate-700">ใช้ Google Sheet เดียวกับหลาย Template ได้ไหม?</p>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-0.5">ได้ครับ แต่แนะนำให้ใช้คนละ Sheet หรือคนละ Tab เพื่อให้ข้อมูลไม่ปนกัน</p>
            </div>
          </div>

        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors" onClick={() => setLightboxImage(null)}>
            <X size={24} />
          </button>
          <img src={lightboxImage} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/20" alt="Zoomed guide" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

