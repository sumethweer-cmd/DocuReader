// Shared types across the P-Admin app
export type View = 'landing' | 'auth' | 'dashboard' | 'admin' | 'link-line'
export type AuthMode = 'login' | 'register'

export type AIConfig = {
  id: string
  model_name: string
  is_active: boolean
  provider: string
  api_key?: string
  stripe_secret_key?: string
  stripe_publishable_key?: string
}

export type PricingPlan = {
  id: string
  name: string
  price_amount: number
  original_price: number
  currency: string
  credits_awarded: number
  max_columns: number
  max_templates: number
  has_googlesheets: boolean
  backlog_days: number
  is_contact_only: boolean
  is_active: boolean
  sort_order: number
  features: string[]
}

export type UseCase = {
  id: string
  title: string
  description: string
  media_url: string
  media_type: 'image' | 'video'
}

export type AdminStats = {
  totalUsers: number
  activeAdmin: number
  totalRevenue: number
  totalTokens: number
  totalCredits: number
}

export type UserProfile = {
  id: string
  email: string
  full_name: string
  phone_number: string
  credits: number
  is_admin: boolean
  tier: string
  max_columns: number
  max_templates: number
  has_googlesheets: boolean
  created_at?: string
}

export type ExtractionTemplate = {
  id: string
  user_id: string
  name: string
  columns: TemplateColumn[]
  description: string
  custom_prompt?: string | null
  webhook_url?: string | null
  header_row_index?: number
  is_default: boolean
  created_at: string
}

export type TemplateColumn = {
  name: string
  type: 'text' | 'number' | 'date' | 'currency'
}

export type Document = {
  id: string
  user_id: string
  filename: string
  original_filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  data: Record<string, unknown> | null
  page_count: number
  file_size: number
  storage_path: string
  template_id: string | null
  created_at: string
}
