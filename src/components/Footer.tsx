import { FileText, Mail, MapPin } from 'lucide-react'
import type { View } from '../types'

export default function Footer({ setView }: { setView: (v: View) => void }) {
  return (
    <footer className="bg-slate-900 text-white pt-20 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white"><FileText size={18} /></div>
              <span className="text-xl font-bold font-headline tracking-tighter">P-<span className="text-indigo-400 font-black">Admin</span></span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md font-body">ระบบอ่านเอกสารอัตโนมัติด้วย AI สกัดข้อมูลจากเอกสารทุกประเภทให้เป็นตาราง CSV หรือส่งตรงไป Google Sheets ได้ทันที</p>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">ลิงก์ด่วน</h4>
            <ul className="space-y-3">
              <li><button onClick={() => setView('landing')} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">หน้าหลัก</button></li>
              <li><button onClick={() => { setView('landing'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100) }} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">แพ็กเกจ</button></li>
              <li><button onClick={() => setView('auth')} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">สมัครสมาชิก</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">ติดต่อ</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-slate-400"><Mail size={14} /> support@docureader.ai</li>
              <li className="flex items-center gap-2 text-sm text-slate-400"><MapPin size={14} /> Bangkok, Thailand</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} P-Admin. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
