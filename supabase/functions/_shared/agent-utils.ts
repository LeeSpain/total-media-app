// Shared utilities for all agent edge functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

// Types
export interface AgentContext {
  supabase: ReturnType<typeof createClient>
  openai: OpenAI
  businessId: string
  taskId?: string
}

export interface AgentResponse {
  success: boolean
  data?: unknown
  error?: string
}

// Initialize clients
export function createAgentContext(req: Request): AgentContext {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!

  const supabase = createClient(supabaseUrl, supabaseKey)
  const openai = new OpenAI({ apiKey: openaiKey })

  // Extract business ID from request
  const url = new URL(req.url)
  const businessId = url.searchParams.get('business_id') || ''

  return { supabase, openai, businessId }
}

// Logging helper
export async function logAgentMessage(
  ctx: AgentContext,
  fromAgent: string,
  message: string,
  toAgent?: string,
  metadata?: Record<string, unknown>
) {
  if (!ctx.taskId) return

  await ctx.supabase.from('agent_messages').insert({
    task_id: ctx.taskId,
    from_agent_id: fromAgent,
    to_agent_id: toAgent,
    message,
    metadata,
  })
}

// Knowledge retrieval (RAG)
export async function queryKnowledge(
  ctx: AgentContext,
  query: string,
  category?: string,
  limit = 5
): Promise<string[]> {
  // Generate embedding for query
  const embeddingResponse = await ctx.openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  const embedding = embeddingResponse.data[0].embedding

  // Query knowledge base
  const { data, error } = await ctx.supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit,
    p_business_id: ctx.businessId,
  })

  if (error) {
    console.error('Knowledge query error:', error)
    return []
  }

  return data.map((k: { content: string }) => k.content)
}

// Save to knowledge base
export async function saveKnowledge(
  ctx: AgentContext,
  title: string,
  content: string,
  category: string,
  agentId: string,
  tags: string[] = []
) {
  // Generate embedding
  const embeddingResponse = await ctx.openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content,
  })

  const embedding = embeddingResponse.data[0].embedding

  const { error } = await ctx.supabase.from('knowledge').insert({
    business_id: ctx.businessId,
    category,
    title,
    content,
    embedding,
    source: 'agent',
    agent_id: agentId,
    tags,
  })

  if (error) {
    console.error('Save knowledge error:', error)
    return false
  }

  return true
}

// Get business context
export async function getBusinessContext(ctx: AgentContext) {
  const { data, error } = await ctx.supabase
    .from('businesses')
    .select('*')
    .eq('id', ctx.businessId)
    .single()

  if (error) {
    console.error('Get business error:', error)
    return null
  }

  return data
}

// Task helpers
export async function updateTaskStatus(
  ctx: AgentContext,
  taskId: string,
  status: string,
  output?: unknown,
  errorMessage?: string
) {
  const updates: Record<string, unknown> = { status }
  
  if (output) updates.output = output
  if (errorMessage) updates.error_message = errorMessage
  if (status === 'running') updates.started_at = new Date().toISOString()
  if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString()
  }

  const { error } = await ctx.supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)

  if (error) {
    console.error('Update task error:', error)
  }
}

export async function createSubTask(
  ctx: AgentContext,
  parentTaskId: string,
  data: {
    type: string
    title: string
    description?: string
    assigned_to: string
    priority?: number
    input?: Record<string, unknown>
  }
) {
  const { data: task, error } = await ctx.supabase
    .from('tasks')
    .insert({
      business_id: ctx.businessId,
      parent_task_id: parentTaskId,
      created_by: 'commander',
      ...data,
    })
    .select()
    .single()

  if (error) {
    console.error('Create subtask error:', error)
    return null
  }

  return task
}

// AI completion helper
export async function complete(
  ctx: AgentContext,
  systemPrompt: string,
  userMessage: string,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    json?: boolean
  } = {}
) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 4096,
    json = false,
  } = options

  try {
    const response = await ctx.openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: json ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const content = response.choices[0]?.message?.content || ''
    return json ? JSON.parse(content) : content
  } catch (error) {
    console.error('AI completion error:', error)
    throw error
  }
}

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// Response helper
export function respond(data: AgentResponse, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
