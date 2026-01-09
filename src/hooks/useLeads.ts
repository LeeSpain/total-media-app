import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useBusiness } from '@/contexts/BusinessContext'

export interface Lead {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  job_title?: string
  linkedin_url?: string
  website?: string
  source: string
  status: 'new' | 'contacted' | 'engaged' | 'qualified' | 'converted' | 'lost'
  score: number
  tags?: string[]
  notes?: string
  enrichment_data?: Record<string, unknown>
  engagement_history?: Array<{ type: string; description: string; created_at: string }>
  created_at: string
  updated_at: string
}

interface UseLeadsOptions {
  status?: string
  limit?: number
  offset?: number
}

export function useLeads(options: UseLeadsOptions = {}) {
  const { currentBusiness } = useBusiness()

  return useQuery({
    queryKey: ['leads', currentBusiness?.id, options],
    queryFn: async () => {
      if (!currentBusiness) return { leads: [], total: 0 }

      let q = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false })

      if (options.status) {
        q = q.eq('status', options.status)
      }
      if (options.limit) {
        q = q.limit(options.limit)
      }
      if (options.offset) {
        q = q.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error, count } = await q

      if (error) throw error
      return { leads: data as Lead[], total: count || 0 }
    },
    enabled: !!currentBusiness,
  })
}

export function useLeadStats() {
  const { currentBusiness } = useBusiness()

  return useQuery({
    queryKey: ['lead-stats', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness) return null

      const { data, error } = await supabase
        .from('leads')
        .select('status, created_at')
        .eq('business_id', currentBusiness.id)

      if (error) throw error

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const stats = {
        total: data.length,
        thisWeek: data.filter((l) => new Date(l.created_at) > weekAgo).length,
        byStatus: {} as Record<string, number>,
      }

      data.forEach((lead) => {
        stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1
      })

      return stats
    },
    enabled: !!currentBusiness,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  const { currentBusiness } = useBusiness()

  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      if (!currentBusiness) throw new Error('No business selected')

      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          business_id: currentBusiness.id,
          status: lead.status || 'new',
          score: lead.score || 50,
          source: lead.source || 'manual',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: Partial<Lead> }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
    },
  })
}
