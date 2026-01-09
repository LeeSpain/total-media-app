// Ambassador Agent - Engagement Specialist
// Manages conversations and nurtures relationships

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAgentContext,
  queryKnowledge,
  getBusinessContext,
  updateTaskStatus,
  complete,
  logAgentMessage,
  corsHeaders,
  respond,
} from '../_shared/agent-utils.ts'

const AGENT_ID = 'ambassador'

const SYSTEM_PROMPT = `You are Ambassador, the engagement specialist for an AI marketing team.

Your mission is to build genuine relationships. You:
1. Respond to comments on social media
2. Handle direct messages professionally
3. Nurture leads through conversation
4. Monitor brand mentions
5. Escalate issues when needed

Be helpful, authentic, and timely. Every interaction is an opportunity.
Match the brand voice while being personable.
Never be defensive - turn complaints into opportunities.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ctx = createAgentContext(req)
    const body = await req.json()
    const { action, taskId, input } = body

    ctx.taskId = taskId

    const business = await getBusinessContext(ctx)
    if (!business) {
      return respond({ success: false, error: 'Business not found' }, 404)
    }

    // Get brand voice and FAQ knowledge
    const brandKnowledge = await queryKnowledge(
      ctx,
      'brand voice tone FAQ responses common questions',
      undefined,
      5
    )

    const brandContext = `
Business: ${business.name}
Products: ${JSON.stringify(business.products)}
Brand Voice: ${JSON.stringify(business.brand_voice)}

Knowledge Base:
${brandKnowledge.join('\n\n')}
`

    let result: unknown

    switch (action) {
      case 'respond_comment': {
        const { comment, platform, context } = input

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Responding to ${platform} comment`
        )

        const response = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Respond to this ${platform} comment:
"${comment}"

Context: ${context || 'General engagement'}

Guidelines:
- Match brand voice
- Be helpful and friendly
- Keep it concise for social
- Include CTA if appropriate
- Never be defensive

Respond in JSON format:
{
  "response": "Your response text",
  "tone": "Tone used (friendly, helpful, etc.)",
  "sentiment": "Detected sentiment of original comment",
  "shouldEscalate": false,
  "escalationReason": "If escalate, why",
  "followUpNeeded": false,
  "suggestedFollowUp": "If follow up needed, what"
}`,
          { json: true }
        )

        await logAgentMessage(ctx, AGENT_ID, `Response drafted (${response.tone})`)

        result = response
        break
      }

      case 'handle_dm': {
        const { message, platform, conversationHistory = [] } = input

        await logAgentMessage(ctx, AGENT_ID, `Handling ${platform} DM`)

        const response = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Handle this direct message on ${platform}:

Conversation history:
${conversationHistory.map((m: {role: string, content: string}) => `${m.role}: ${m.content}`).join('\n')}

New message: "${message}"

Guidelines:
- Be personal and helpful
- Answer questions accurately
- Guide toward next steps
- Offer to connect with human if complex

Respond in JSON format:
{
  "response": "Your response",
  "intent": "What the person wants",
  "sentiment": "Their sentiment",
  "leadPotential": "high|medium|low|none",
  "suggestedAction": "Next step for this lead",
  "shouldEscalate": false,
  "escalationReason": "If escalate, why",
  "knowledgeGap": "Info we don't have but need"
}`,
          { json: true }
        )

        // If high lead potential, update or create lead
        if (response.leadPotential === 'high') {
          await logAgentMessage(
            ctx,
            AGENT_ID,
            'High potential lead detected in DM'
          )
        }

        result = response
        break
      }

      case 'nurture_lead': {
        const { leadId, stage } = input

        const { data: lead, error } = await ctx.supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single()

        if (error || !lead) {
          return respond({ success: false, error: 'Lead not found' }, 404)
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Nurturing lead: ${lead.name} (${stage})`
        )

        const nurturePlan = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Create a nurture plan for this lead:
${JSON.stringify(lead, null, 2)}

Current stage: ${stage}
Goal: Move them toward conversion

Respond in JSON format:
{
  "currentAssessment": "Where they are in their journey",
  "nextActions": [
    {
      "action": "What to do",
      "channel": "email|social|dm|call",
      "timing": "When to do it",
      "message": "Draft message/talking points",
      "goal": "What we hope to achieve"
    }
  ],
  "contentToShare": ["Relevant content to share"],
  "questionsToAsk": ["Questions to learn more"],
  "objectionHandling": ["Likely objections and responses"],
  "conversionProbability": "high|medium|low",
  "estimatedTimeline": "Time to conversion"
}`,
          { model: 'gpt-4o', json: true }
        )

        // Update lead with engagement
        await ctx.supabase.from('leads').update({
          engagement_history: [
            ...(lead.engagement_history || []),
            {
              type: 'nurture_plan',
              description: `Nurture plan created for ${stage} stage`,
              created_at: new Date().toISOString(),
            },
          ],
        }).eq('id', leadId)

        await logAgentMessage(ctx, AGENT_ID, `Nurture plan created`)

        result = nurturePlan
        break
      }

      case 'process_mentions': {
        const { mentions } = input

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Processing ${mentions.length} brand mentions`
        )

        const processed = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Process these brand mentions and decide how to respond:
${JSON.stringify(mentions, null, 2)}

For each mention, determine:
- Should we respond?
- What should we say?
- Is this an opportunity or threat?

Respond in JSON format:
{
  "mentions": [
    {
      "id": "mention id",
      "shouldRespond": true/false,
      "response": "Draft response if responding",
      "priority": "high|medium|low",
      "sentiment": "positive|neutral|negative",
      "opportunity": "What opportunity this presents",
      "risk": "Any risk to address"
    }
  ],
  "summary": {
    "totalPositive": 0,
    "totalNeutral": 0,
    "totalNegative": 0,
    "actionRequired": 0,
    "opportunities": ["Key opportunities found"]
  }
}`,
          { json: true }
        )

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Processed: ${processed.summary.actionRequired} need response`
        )

        result = processed
        break
      }

      default:
        return respond({ success: false, error: `Unknown action: ${action}` }, 400)
    }

    if (taskId) {
      await updateTaskStatus(ctx, taskId, 'completed', result)
    }

    return respond({ success: true, data: result })
  } catch (error) {
    console.error('Ambassador error:', error)
    return respond({ success: false, error: error.message }, 500)
  }
})
