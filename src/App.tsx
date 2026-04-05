import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ToastProvider, useToast } from './components/Toast'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'
import AuthView from './components/AuthView'
import DashboardView from './components/DashboardView'
import AdminView from './components/AdminView'
import type { View, AuthMode, AIConfig, PricingPlan, UseCase, AdminStats, UserProfile } from './types'

function AppContent() {
  const { toast } = useToast()
  const [view, setView] = useState<View>('landing')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [session, setSession] = useState<unknown>(null)
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeAdmin: 0, totalRevenue: 0, totalTokens: 0, totalCredits: 0 })
  const [useCaseTitle, setUseCaseTitle] = useState('')
  const [useCaseDesc, setUseCaseDesc] = useState('')
  const [isAddingUseCase, setIsAddingUseCase] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s) fetchProfile((s as { user: { id: string } }).user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) fetchProfile(s.user.id)
      else setUserProfile(null)
    })
    fetchPricing()
    fetchUseCases()
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setUserProfile(data as UserProfile)
  }

  const fetchPricing = async () => {
    const { data } = await supabase.from('pricing_plans').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    if (data) setPricingPlans(data as PricingPlan[])
  }

  const fetchUseCases = async () => {
    const { data } = await supabase.from('use_cases').select('*').order('created_at', { ascending: false })
    if (data) setUseCases(data as UseCase[])
  }

  const fetchAdminStats = async () => {
    try {
      const { data: users } = await supabase.from('profiles').select('id, is_admin, credits')
      const { data: transactions } = await supabase.from('transactions').select('amount').eq('status', 'success')
      const { data: logs } = await supabase.from('usage_logs').select('tokens_used')
      setStats({
        totalUsers: users?.length || 0,
        activeAdmin: users?.filter((u: { is_admin: boolean }) => u.is_admin)?.length || 0,
        totalRevenue: transactions?.reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0) || 0,
        totalTokens: logs?.reduce((sum: number, l: { tokens_used: number }) => sum + (l.tokens_used || 0), 0) || 0,
        totalCredits: users?.reduce((sum: number, u: { credits: number }) => sum + (u.credits || 0), 0) || 0,
      })
    } catch (e) { console.error(e) }
  }

  const fetchAdminData = async () => {
    const { data: configs } = await supabase.from('ai_configs').select('*').order('model_name', { ascending: true })
    if (configs) setAiConfigs(configs as AIConfig[])
    const activeConfig = (configs as AIConfig[] | null)?.find(c => c.is_active)
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
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, phone_number: phone } } })
        if (error) throw error
        setMessage({ type: 'success', text: 'ไปยืนยันตัวตนในอีเมลของคุณได้เลย!' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setView('dashboard')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setMessage({ type: 'error', text: msg })
    } finally { setAuthLoading(false) }
  }

  const toggleModel = async (id: string) => {
    await supabase.from('ai_configs').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('ai_configs').update({ is_active: true }).eq('id', id)
    fetchAdminData()
  }

  const updateSystemConfigs = async () => {
    const active = aiConfigs.find(c => c.is_active)
    if (!active) return
    const { error } = await supabase.from('ai_configs').update({
      api_key: apiKey || active.api_key,
      stripe_secret_key: stripeSecret,
      stripe_publishable_key: stripePublishable,
    }).eq('id', active.id)
    if (error) toast('error', error.message)
    else { toast('success', 'บันทึกสำเร็จ!'); setApiKey('') }
  }

  const addUseCase = async (file: File | null) => {
    if (!file) { toast('error', 'กรุณาเลือกไฟล์'); return }
    setIsAddingUseCase(true)
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('use_case_media').upload(fileName, file)
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('use_case_media').getPublicUrl(fileName)
      const { error } = await supabase.from('use_cases').insert([{ title: useCaseTitle, description: useCaseDesc, media_url: publicUrl, media_type: 'image' }])
      if (error) throw error
      setUseCaseTitle(''); setUseCaseDesc(''); fetchUseCases()
      toast('success', 'อัปโหลดผลงานสำเร็จ!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      toast('error', msg)
    } finally { setIsAddingUseCase(false) }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setView('landing')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="font-body min-h-screen bg-white">
      <Navbar view={view} setView={setView} session={session} userProfile={userProfile} setAuthMode={setAuthMode} onSignOut={handleSignOut} />
      <div className="animate-fadeIn">
        {view === 'landing' && <LandingPage pricingPlans={pricingPlans} useCases={useCases} setView={setView} />}
        {view === 'auth' && <AuthView authMode={authMode} setAuthMode={setAuthMode} handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} fullName={fullName} setFullName={setFullName} phone={phone} setPhone={setPhone} authLoading={authLoading} message={message} />}
        {view === 'dashboard' && (session ? <DashboardView userProfile={userProfile} setView={setView} refreshProfile={() => fetchProfile((session as { user: { id: string } }).user.id)} /> : <AuthView authMode={authMode} setAuthMode={setAuthMode} handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} fullName={fullName} setFullName={setFullName} phone={phone} setPhone={setPhone} authLoading={authLoading} message={message} />)}
        {view === 'admin' && <AdminView aiConfigs={aiConfigs} apiKey={apiKey} setApiKey={setApiKey} stripeSecret={stripeSecret} setStripeSecret={setStripeSecret} stripePublishable={stripePublishable} setStripePublishable={setStripePublishable} toggleModel={toggleModel} updateSystemConfigs={updateSystemConfigs} setView={setView} useCaseTitle={useCaseTitle} setUseCaseTitle={setUseCaseTitle} useCaseDesc={useCaseDesc} setUseCaseDesc={setUseCaseDesc} addUseCase={addUseCase} isAddingUseCase={isAddingUseCase} stats={stats} pricingPlans={pricingPlans} refreshPricing={fetchPricing} />}
      </div>
    </div>
  )
}

export default function App() {
  return <ToastProvider><AppContent /></ToastProvider>
}
