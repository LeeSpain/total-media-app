import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useBusiness } from '@/contexts/BusinessContext'
import { useEffect } from 'react'

export interface Task {
  id: string
  business_id: string
  campaign_id?: string
  parent_task_id?: string
  type: string
  title: string
  description?: string
  status: 'queued' | 'running' | 'review' | 'approved' | 'completed' | 'failed'
  priority: number
  assigned_to: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error_message?: string
  created_by: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

interface UseTasksOptions {
  status?: string
  limit?: number
  campaignId?: string
}

export function useTasks(options: UseTasksOptions = {}) {
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['tasks', currentBusiness?.id, options],
    queryFn: async () => {
      if (!currentBusiness) return []
      
      let q = supabase
        .from('tasks')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false })
      
      if (options.status) {
        q = q.eq('status', options.status)
      }
      if (options.campaignId) {
        q = q.eq('campaign_id', options.campaignId)
      }
      if (options.limit) {
        q = q.limit(options.limit)
      }

      const { data, error } = await q
      if (error) throw error
      return data as Task[]
    },
    enabled: !!currentBusiness,
  })

  // Real-time subscription
  useEffect(() => {
    if (!currentBusiness) return

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `business_id=eq.${currentBusiness.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', currentBusiness.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentBusiness, queryClient])

  return query
}

export function useTaskQueue() {
  const { currentBusiness } = useBusiness()

  return useQuery({
    queryKey: ['task-queue', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness) return { queued: 0, running: 0, review: 0 }
      
      const { data, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('business_id', currentBusiness.id)
        .in('status', ['queued', 'running', 'review'])

      if (error) throw error

      return {
        queued: data.filter((t) => t.status === 'queued').length,
        running: data.filter((t) => t.status === 'running').length,
        review: data.filter((t) => t.status === 'review').length,
      }
    },
    enabled: !!currentBusiness,
    refetchInterval: 5000, // Poll every 5 seconds
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { currentBusiness } = useBusiness()

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      if (!currentBusiness) throw new Error('No business selected')

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          business_id: currentBusiness.id,
          status: 'queued',
          created_by: 'human',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-queue'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-queue'] })
    },
  })
}

export function useApproveTask() {
  const updateTask = useUpdateTask()

  return useMutation({
    mutationFn: async (taskId: string) => {
      return updateTask.mutateAsync({
        taskId,
        updates: { status: 'approved' },
      })
    },
  })
}

export function useRejectTask() {
  const updateTask = useUpdateTask()

  return useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: string; reason: string }) => {
      return updateTask.mutateAsync({
        taskId,
        updates: { status: 'failed', error_message: reason },
      })
    },
  })
}
