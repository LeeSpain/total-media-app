// ============================================
// CORE TYPES - Total Media App
// ============================================

// --------------------------------------------
// AGENTS
// --------------------------------------------

export type AgentType = 
  | 'commander'
  | 'scout'
  | 'spy'
  | 'writer'
  | 'artist'
  | 'broadcaster'
  | 'ambassador'
  | 'oracle'

export type AgentStatus = 'active' | 'paused' | 'working' | 'error'

export interface Agent {
  id: string
  name: string
  type: AgentType
  role: string
  description: string
  system_prompt: string
  model: string
  temperature: number
  tools: string[]
  status: AgentStatus
  created_at: string
  updated_at: string
}

export interface AgentMessage {
  id: string
  task_id: string
  from_agent_id: string
  to_agent_id: string | null
  message: string
  metadata?: Record<string, unknown>
  created_at: string
}

// --------------------------------------------
// BUSINESSES
// --------------------------------------------

export type AutonomyLevel = 'supervised' | 'semi-auto' | 'full-auto'

export interface Business {
  id: string
  name: string
  website: string
  description: string
  logo_url?: string
  products: Product[]
  target_audience: TargetAudience
  brand_voice: BrandVoice
  competitors: Competitor[]
  api_config?: APIConfig
  autonomy_level: AutonomyLevel
  status: 'active' | 'paused' | 'setup'
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price?: string
  features: string[]
  benefits: string[]
  target_persona?: string
}

export interface TargetAudience {
  demographics: {
    age_range?: string
    gender?: string
    location?: string[]
    income_level?: string
  }
  psychographics: {
    interests: string[]
    pain_points: string[]
    goals: string[]
    values: string[]
  }
  behavior: {
    platforms: string[]
    buying_triggers: string[]
    objections: string[]
  }
}

export interface BrandVoice {
  tone: string[]
  personality: string[]
  do: string[]
  dont: string[]
  examples: {
    good: string[]
    bad: string[]
  }
}

export interface Competitor {
  name: string
  website: string
  strengths: string[]
  weaknesses: string[]
  positioning: string
}

export interface APIConfig {
  type: 'webhook' | 'rest' | 'graphql'
  base_url: string
  auth_type: 'api_key' | 'oauth' | 'bearer'
  credentials: Record<string, string>
  endpoints: {
    leads?: string
    customers?: string
    analytics?: string
  }
}

// --------------------------------------------
// TASKS
// --------------------------------------------

export type TaskType = 
  | 'strategy'
  | 'research'
  | 'intel'
  | 'write'
  | 'design'
  | 'publish'
  | 'engage'
  | 'analyze'
  | 'review'

export type TaskStatus = 
  | 'queued'
  | 'running'
  | 'review'
  | 'approved'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type TaskPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface Task {
  id: string
  business_id: string
  campaign_id?: string
  type: TaskType
  title: string
  description: string
  assigned_to: AgentType
  created_by: AgentType | 'human'
  parent_task_id?: string
  priority: TaskPriority
  status: TaskStatus
  input: Record<string, unknown>
  output?: Record<string, unknown>
  feedback?: TaskFeedback
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface TaskFeedback {
  approved: boolean
  comments?: string
  revision_requested?: boolean
  reviewed_by: AgentType | 'human'
  reviewed_at: string
}

// --------------------------------------------
// CAMPAIGNS
// --------------------------------------------

export type CampaignStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived'

export type CampaignChannel = 
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'email'
  | 'blog'
  | 'paid_ads'

export interface Campaign {
  id: string
  business_id: string
  name: string
  description: string
  goal: string
  strategy: CampaignStrategy
  target_audience?: string
  channels: CampaignChannel[]
  status: CampaignStatus
  start_date?: string
  end_date?: string
  budget?: number
  metrics: CampaignMetrics
  created_by: AgentType | 'human'
  created_at: string
  updated_at: string
}

export interface CampaignStrategy {
  approach: string
  key_messages: string[]
  content_themes: string[]
  posting_frequency: Record<CampaignChannel, string>
  success_criteria: string[]
}

export interface CampaignMetrics {
  impressions: number
  engagement: number
  clicks: number
  conversions: number
  leads_generated: number
  cost_per_lead?: number
}

// --------------------------------------------
// CONTENT
// --------------------------------------------

export type ContentType = 
  | 'social_post'
  | 'blog_article'
  | 'email'
  | 'ad_copy'
  | 'video_script'
  | 'image'
  | 'video'

export type ContentStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'archived'

export interface Content {
  id: string
  business_id: string
  campaign_id?: string
  task_id: string
  type: ContentType
  channel: CampaignChannel
  title?: string
  body: string
  media_urls: string[]
  status: ContentStatus
  scheduled_for?: string
  published_at?: string
  external_id?: string
  external_url?: string
  metrics?: ContentMetrics
  created_by: AgentType
  created_at: string
  updated_at: string
}

export interface ContentMetrics {
  impressions: number
  engagement: number
  likes: number
  comments: number
  shares: number
  clicks: number
  conversions: number
}

// --------------------------------------------
// LEADS
// --------------------------------------------

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'engaged'
  | 'qualified'
  | 'converted'
  | 'lost'
  | 'unsubscribed'

export type LeadSource = 
  | 'organic_search'
  | 'social_media'
  | 'referral'
  | 'paid_ads'
  | 'email_campaign'
  | 'research'
  | 'website'
  | 'api_sync'
  | 'manual'

export interface Lead {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  job_title?: string
  website?: string
  linkedin_url?: string
  source: LeadSource
  source_details?: string
  score: number
  status: LeadStatus
  tags: string[]
  notes: string
  enrichment_data?: LeadEnrichment
  engagement_history: LeadEngagement[]
  synced_to_crm: boolean
  external_crm_id?: string
  created_at: string
  updated_at: string
}

export interface LeadEnrichment {
  company_info?: {
    size?: string
    industry?: string
    revenue?: string
    location?: string
  }
  social_profiles?: {
    twitter?: string
    linkedin?: string
    facebook?: string
  }
  technology_stack?: string[]
  recent_news?: string[]
}

export interface LeadEngagement {
  id: string
  type: 'email_sent' | 'email_opened' | 'email_clicked' | 'social_interaction' | 'website_visit' | 'form_submission' | 'call' | 'meeting'
  description: string
  content_id?: string
  campaign_id?: string
  created_at: string
}

// --------------------------------------------
// KNOWLEDGE / RAG
// --------------------------------------------

export type KnowledgeCategory = 
  | 'product'
  | 'audience'
  | 'competitor'
  | 'brand'
  | 'research'
  | 'campaign'
  | 'learning'
  | 'general'

export interface Knowledge {
  id: string
  business_id: string
  category: KnowledgeCategory
  title: string
  content: string
  embedding?: number[]
  source: 'manual' | 'agent' | 'import' | 'research'
  source_url?: string
  agent_id?: string
  tags: string[]
  expires_at?: string
  created_at: string
  updated_at: string
}

// --------------------------------------------
// ANALYTICS
// --------------------------------------------

export type MetricType = 
  | 'impressions'
  | 'engagement'
  | 'clicks'
  | 'conversions'
  | 'leads'
  | 'revenue'
  | 'cost'
  | 'roi'

export interface AnalyticsRecord {
  id: string
  business_id: string
  content_id?: string
  campaign_id?: string
  channel: CampaignChannel
  metric: MetricType
  value: number
  recorded_at: string
  created_at: string
}

export interface AnalyticsSummary {
  business_id: string
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  start_date: string
  end_date: string
  metrics: Record<MetricType, number>
  by_channel: Record<CampaignChannel, Record<MetricType, number>>
  top_content: Content[]
  insights: string[]
}

// --------------------------------------------
// CONNECTIONS / INTEGRATIONS
// --------------------------------------------

export type ConnectionPlatform = 
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'google_analytics'
  | 'email_resend'
  | 'email_sendgrid'
  | 'crm_custom'

export type ConnectionStatus = 'active' | 'expired' | 'error' | 'pending'

export interface Connection {
  id: string
  business_id: string
  platform: ConnectionPlatform
  status: ConnectionStatus
  credentials: Record<string, string>
  scopes: string[]
  last_used?: string
  expires_at?: string
  error_message?: string
  created_at: string
  updated_at: string
}

// --------------------------------------------
// USER & AUTH
// --------------------------------------------

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: UserRole
  business_ids: string[]
  preferences: UserPreferences
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
    task_updates: boolean
    campaign_alerts: boolean
  }
  default_business_id?: string
}

// --------------------------------------------
// API RESPONSES
// --------------------------------------------

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// --------------------------------------------
// REAL-TIME EVENTS
// --------------------------------------------

export type RealtimeEventType = 
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'agent.status_changed'
  | 'content.published'
  | 'lead.created'
  | 'campaign.updated'
  | 'analytics.updated'

export interface RealtimeEvent {
  type: RealtimeEventType
  business_id: string
  payload: Record<string, unknown>
  timestamp: string
}
