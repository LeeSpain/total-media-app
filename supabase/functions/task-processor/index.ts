// Task Processor - Background Job Runner
// Processes queued tasks and dispatches to appropriate agents

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Agent endpoints mapping
const AGENT_ENDPOINTS: Record<string, string> = {
  commander: 'commander',
  scout: 'scout',
  spy: 'spy',
  writer: 'writer',
  artist: 'artist',
  broadcaster: 'broadcaster',
  ambassador: 'ambassador',
  oracle: 'oracle',
}

// Task type to agent mapping
const TASK_AGENT_MAP: Record<string, string> = {
  strategy: 'commander',
  plan: 'commander',
  review: 'commander',
  research: 'scout',
  discover: 'scout',
  qualify: 'scout',
  intel: 'spy',
  competitor: 'spy',
  trends: 'spy',
  write: 'writer',
  content: 'writer',
  email: 'writer',
  design: 'artist',
  image: 'artist',
  visual: 'artist',
  publish: 'broadcaster',
  schedule: 'broadcaster',
  send: 'broadcaster',
  engage: 'ambassador',
  respond: 'ambassador',
  nurture: 'ambassador',
  analyze: 'oracle',
  report: 'oracle',
  metrics: 'oracle',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const body = await req.json()
    const { action, businessId, taskId } = body

    switch (action) {
      case 'process_queue': {
        // Get all queued tasks for the business, ordered by priority
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('business_id', businessId)
          .eq('status', 'queued')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(10)

        if (error) throw error

        const processed = []
        const failed = []

        for (const task of tasks || []) {
          try {
            // Determine which agent should handle this task
            const agent = task.assigned_to || TASK_AGENT_MAP[task.type] || 'commander'
            const endpoint = AGENT_ENDPOINTS[agent]

            if (!endpoint) {
              throw new Error(`No agent found for task type: ${task.type}`)
            }

            // Mark task as running
            await supabase
              .from('tasks')
              .update({ status: 'running', started_at: new Date().toISOString() })
              .eq('id', task.id)

            // Invoke the agent
            const { data, error: invokeError } = await supabase.functions.invoke(endpoint, {
              body: {
                action: task.type,
                taskId: task.id,
                input: task.input,
              },
            })

            if (invokeError) throw invokeError

            processed.push({ taskId: task.id, agent, result: data })
          } catch (taskError) {
            console.error(`Failed to process task ${task.id}:`, taskError)
            
            // Mark task as failed
            await supabase
              .from('tasks')
              .update({
                status: 'failed',
                error_message: taskError.message,
                completed_at: new Date().toISOString(),
              })
              .eq('id', task.id)

            failed.push({ taskId: task.id, error: taskError.message })
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              total: tasks?.length || 0,
              processed: processed.length,
              failed: failed.length,
              details: { processed, failed },
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'process_single': {
        // Process a specific task
        const { data: task, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single()

        if (error || !task) {
          return new Response(
            JSON.stringify({ success: false, error: 'Task not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const agent = task.assigned_to || TASK_AGENT_MAP[task.type] || 'commander'
        const endpoint = AGENT_ENDPOINTS[agent]

        // Mark as running
        await supabase
          .from('tasks')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('id', task.id)

        // Invoke agent
        const { data, error: invokeError } = await supabase.functions.invoke(endpoint, {
          body: {
            action: task.type,
            taskId: task.id,
            input: task.input,
          },
        })

        if (invokeError) {
          await supabase
            .from('tasks')
            .update({
              status: 'failed',
              error_message: invokeError.message,
              completed_at: new Date().toISOString(),
            })
            .eq('id', task.id)

          throw invokeError
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_queue_status': {
        // Get current queue status
        const { data, error } = await supabase
          .from('tasks')
          .select('status, assigned_to')
          .eq('business_id', businessId)
          .in('status', ['queued', 'running', 'review'])

        if (error) throw error

        const status = {
          queued: 0,
          running: 0,
          review: 0,
          byAgent: {} as Record<string, number>,
        }

        for (const task of data || []) {
          status[task.status as keyof typeof status]++
          if (task.assigned_to) {
            status.byAgent[task.assigned_to] = (status.byAgent[task.assigned_to] || 0) + 1
          }
        }

        return new Response(
          JSON.stringify({ success: true, data: status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Task processor error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
