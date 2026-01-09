import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useBusiness } from '@/contexts/BusinessContext'
import { useEffect, useState } from 'react'

export interface Agent {
  id: string
  type: string
  name: string
  role: string
  status: 'active' | 'working' | 'idle' | 'error'
  config: Record<string, unknown>
  system_prompt: string
  created_at: string
  updated_at: string
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at')
      
      if (error) throw error
      return data as Agent[]
    },
  })
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()
      
      if (error) throw error
      return data as Agent
    },
    enabled: !!agentId,
  })
}

export function useAgentStatus(businessId: string) {
  const [status, setStatus] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!businessId) return

    // Initial fetch of running tasks to determine agent status
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('assigned_to, status')
        .eq('business_id', businessId)
        .eq('status', 'running')

      const newStatus: Record<string, string> = {}
      data?.forEach((task) => {
        if (task.assigned_to) {
          newStatus[task.assigned_to] = 'working'
        }
      })
      setStatus(newStatus)
    }

    fetchStatus()

    // Subscribe to task changes
    const channel = supabase
      .channel('agent-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'assigned_to' in payload.new) {
            const task = payload.new as { assigned_to: string; status: string }
            setStatus((prev) => ({
              ...prev,
              [task.assigned_to]: task.status === 'running' ? 'working' : 'active',
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId])

  return { data: status }
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ agentId, updates }: { agentId: string; updates: Partial<Agent> }) => {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', agentId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

export function useInvokeAgent() {
  return useMutation({
    mutationFn: async ({
      agentType,
      action,
      businessId,
      input,
    }: {
      agentType: string
      action: string
      businessId: string
      input?: Record<string, unknown>
    }) => {
      const { data, error } = await supabase.functions.invoke(agentType, {
        body: { action, businessId, input },
      })

      if (error) throw error
      return data
    },
  })
}
