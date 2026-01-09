// Embeddings Service - RAG Infrastructure
// Handles embedding generation and similarity search

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!

  const supabase = createClient(supabaseUrl, supabaseKey)
  const openai = new OpenAI({ apiKey: openaiKey })

  try {
    const body = await req.json()
    const { action, businessId } = body

    switch (action) {
      case 'embed': {
        // Generate embedding for text
        const { text } = body

        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
        })

        return new Response(
          JSON.stringify({
            success: true,
            data: { embedding: response.data[0].embedding },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'embed_batch': {
        // Generate embeddings for multiple texts
        const { texts } = body

        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: texts,
        })

        return new Response(
          JSON.stringify({
            success: true,
            data: { embeddings: response.data.map((d) => d.embedding) },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'search': {
        // Semantic search in knowledge base
        const { query, category, limit = 5, threshold = 0.7 } = body

        // Generate query embedding
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: query,
        })

        const queryEmbedding = embeddingResponse.data[0].embedding

        // Search using pgvector
        const { data, error } = await supabase.rpc('match_knowledge', {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: limit,
          p_business_id: businessId,
        })

        if (error) throw error

        return new Response(
          JSON.stringify({
            success: true,
            data: { results: data },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'add_knowledge': {
        // Add new knowledge with embedding
        const { title, content, category, source, tags = [] } = body

        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: content,
        })

        const embedding = embeddingResponse.data[0].embedding

        // Insert into knowledge base
        const { data, error } = await supabase
          .from('knowledge')
          .insert({
            business_id: businessId,
            title,
            content,
            category,
            source: source || 'manual',
            embedding,
            tags,
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_embeddings': {
        // Re-generate embeddings for knowledge without them
        const { data: knowledge, error } = await supabase
          .from('knowledge')
          .select('id, content')
          .eq('business_id', businessId)
          .is('embedding', null)
          .limit(100)

        if (error) throw error

        let updated = 0
        for (const item of knowledge || []) {
          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: item.content,
          })

          await supabase
            .from('knowledge')
            .update({ embedding: embeddingResponse.data[0].embedding })
            .eq('id', item.id)

          updated++
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: { updated, total: knowledge?.length || 0 },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_context': {
        // Get contextual knowledge for a task
        const { taskDescription, maxTokens = 4000 } = body

        // Search for relevant knowledge
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: taskDescription,
        })

        const { data: results } = await supabase.rpc('match_knowledge', {
          query_embedding: embeddingResponse.data[0].embedding,
          match_threshold: 0.6,
          match_count: 20,
          p_business_id: businessId,
        })

        // Estimate tokens and truncate if needed (rough estimate: 4 chars = 1 token)
        let context = ''
        let estimatedTokens = 0

        for (const result of results || []) {
          const itemTokens = Math.ceil(result.content.length / 4)
          if (estimatedTokens + itemTokens > maxTokens) break

          context += `\n\n### ${result.title} (${result.category})\n${result.content}`
          estimatedTokens += itemTokens
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              context,
              sources: results?.map((r: { id: string; title: string; similarity: number }) => ({
                id: r.id,
                title: r.title,
                similarity: r.similarity,
              })),
              estimatedTokens,
            },
          }),
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
    console.error('Embeddings error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
