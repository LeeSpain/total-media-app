export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          type: string
          role: string
          description: string | null
          system_prompt: string
          model: string
          temperature: number
          tools: string[]
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          role: string
          description?: string | null
          system_prompt: string
          model?: string
          temperature?: number
          tools?: string[]
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          role?: string
          description?: string | null
          system_prompt?: string
          model?: string
          temperature?: number
          tools?: string[]
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      agent_messages: {
        Row: {
          id: string
          task_id: string
          from_agent_id: string
          to_agent_id: string | null
          message: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          from_agent_id: string
          to_agent_id?: string | null
          message: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          from_agent_id?: string
          to_agent_id?: string | null
          message?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          name: string
          website: string | null
          description: string | null
          logo_url: string | null
          products: Json
          target_audience: Json
          brand_voice: Json
          competitors: Json
          api_config: Json | null
          autonomy_level: string
          status: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          website?: string | null
          description?: string | null
          logo_url?: string | null
          products?: Json
          target_audience?: Json
          brand_voice?: Json
          competitors?: Json
          api_config?: Json | null
          autonomy_level?: string
          status?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          website?: string | null
          description?: string | null
          logo_url?: string | null
          products?: Json
          target_audience?: Json
          brand_voice?: Json
          competitors?: Json
          api_config?: Json | null
          autonomy_level?: string
          status?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          business_id: string
          campaign_id: string | null
          type: string
          title: string
          description: string | null
          assigned_to: string
          created_by: string
          parent_task_id: string | null
          priority: number
          status: string
          input: Json
          output: Json | null
          feedback: Json | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          campaign_id?: string | null
          type: string
          title: string
          description?: string | null
          assigned_to: string
          created_by: string
          parent_task_id?: string | null
          priority?: number
          status?: string
          input?: Json
          output?: Json | null
          feedback?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          campaign_id?: string | null
          type?: string
          title?: string
          description?: string | null
          assigned_to?: string
          created_by?: string
          parent_task_id?: string | null
          priority?: number
          status?: string
          input?: Json
          output?: Json | null
          feedback?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          goal: string | null
          strategy: Json
          target_audience: string | null
          channels: string[]
          status: string
          start_date: string | null
          end_date: string | null
          budget: number | null
          metrics: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          goal?: string | null
          strategy?: Json
          target_audience?: string | null
          channels?: string[]
          status?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          metrics?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          description?: string | null
          goal?: string | null
          strategy?: Json
          target_audience?: string | null
          channels?: string[]
          status?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          metrics?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          business_id: string
          campaign_id: string | null
          task_id: string | null
          type: string
          channel: string
          title: string | null
          body: string
          media_urls: string[]
          status: string
          scheduled_for: string | null
          published_at: string | null
          external_id: string | null
          external_url: string | null
          metrics: Json | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          campaign_id?: string | null
          task_id?: string | null
          type: string
          channel: string
          title?: string | null
          body: string
          media_urls?: string[]
          status?: string
          scheduled_for?: string | null
          published_at?: string | null
          external_id?: string | null
          external_url?: string | null
          metrics?: Json | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          campaign_id?: string | null
          task_id?: string | null
          type?: string
          channel?: string
          title?: string | null
          body?: string
          media_urls?: string[]
          status?: string
          scheduled_for?: string | null
          published_at?: string | null
          external_id?: string | null
          external_url?: string | null
          metrics?: Json | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          business_id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          job_title: string | null
          website: string | null
          linkedin_url: string | null
          source: string
          source_details: string | null
          score: number
          status: string
          tags: string[]
          notes: string | null
          enrichment_data: Json | null
          engagement_history: Json
          synced_to_crm: boolean
          external_crm_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          website?: string | null
          linkedin_url?: string | null
          source: string
          source_details?: string | null
          score?: number
          status?: string
          tags?: string[]
          notes?: string | null
          enrichment_data?: Json | null
          engagement_history?: Json
          synced_to_crm?: boolean
          external_crm_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          website?: string | null
          linkedin_url?: string | null
          source?: string
          source_details?: string | null
          score?: number
          status?: string
          tags?: string[]
          notes?: string | null
          enrichment_data?: Json | null
          engagement_history?: Json
          synced_to_crm?: boolean
          external_crm_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      knowledge: {
        Row: {
          id: string
          business_id: string
          category: string
          title: string
          content: string
          embedding: number[] | null
          source: string
          source_url: string | null
          agent_id: string | null
          tags: string[]
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          category: string
          title: string
          content: string
          embedding?: number[] | null
          source?: string
          source_url?: string | null
          agent_id?: string | null
          tags?: string[]
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          category?: string
          title?: string
          content?: string
          embedding?: number[] | null
          source?: string
          source_url?: string | null
          agent_id?: string | null
          tags?: string[]
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          business_id: string
          content_id: string | null
          campaign_id: string | null
          channel: string
          metric: string
          value: number
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          content_id?: string | null
          campaign_id?: string | null
          channel: string
          metric: string
          value: number
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          content_id?: string | null
          campaign_id?: string | null
          channel?: string
          metric?: string
          value?: number
          recorded_at?: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          business_id: string
          platform: string
          status: string
          credentials: Json
          scopes: string[]
          last_used: string | null
          expires_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          platform: string
          status?: string
          credentials?: Json
          scopes?: string[]
          last_used?: string | null
          expires_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          platform?: string
          status?: string
          credentials?: Json
          scopes?: string[]
          last_used?: string | null
          expires_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_knowledge: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          p_business_id: string
        }
        Returns: {
          id: string
          business_id: string
          category: string
          title: string
          content: string
          similarity: number
        }[]
      }
    }
    Enums: {
      agent_type: 'commander' | 'scout' | 'spy' | 'writer' | 'artist' | 'broadcaster' | 'ambassador' | 'oracle'
      agent_status: 'active' | 'paused' | 'working' | 'error'
      task_status: 'queued' | 'running' | 'review' | 'approved' | 'completed' | 'failed' | 'cancelled'
      autonomy_level: 'supervised' | 'semi-auto' | 'full-auto'
      campaign_status: 'planning' | 'active' | 'paused' | 'completed' | 'archived'
      content_status: 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed' | 'archived'
      lead_status: 'new' | 'contacted' | 'engaged' | 'qualified' | 'converted' | 'lost' | 'unsubscribed'
    }
  }
}
