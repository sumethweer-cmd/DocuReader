import React, { useState, useCallback, createContext, useContext } from 'react'
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; type: ToastType; text: string; leaving?: boolean }

const ToastContext = createContext<{ toast: (type: ToastType, text: string) => void }>({ toast: () => {} })

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let counter = 0

  const toast = useCallback((type: ToastType, text: string) => {
    const id = ++counter
    setToasts(prev => [...prev, { id, type, text }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
    }, 3500)
  }, [])

  const dismiss = (id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }

  const icons = { success: <CheckCircle2 size={18} />, error: <AlertCircle size={18} />, info: <Info size={18} /> }
  const colors = { success: 'bg-emerald-50 text-emerald-700 border-emerald-200', error: 'bg-rose-50 text-rose-700 border-rose-200', info: 'bg-blue-50 text-blue-700 border-blue-200' }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-lg text-sm font-bold ${colors[t.type]} ${t.leaving ? 'animate-toast-out' : 'animate-toast-in'}`}>
            {icons[t.type]}
            <span className="flex-1">{t.text}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
