import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper for authenticated requests to edge functions
export async function invokeAgent(
  agentType: string,
  payload: Record<string, unknown>
) {
  const { data, error } = await supabase.functions.invoke(agentType, {
    body: payload,
  })

  if (error) throw error
  return data
}

// Real-time subscription helper
export function subscribeToTasks(
  businessId: string,
  callback: (payload: unknown) => void
) {
  return supabase
    .channel(`tasks:${businessId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `business_id=eq.${businessId}`,
      },
      callback
    )
    .subscribe()
}

export function subscribeToAgentMessages(
  taskId: string,
  callback: (payload: unknown) => void
) {
  return supabase
    .channel(`agent_messages:${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_messages',
        filter: `task_id=eq.${taskId}`,
      },
      callback
    )
    .subscribe()
}
