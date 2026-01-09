// Commander Agent - The Strategic Brain
// Orchestrates all other agents, makes decisions, reviews work

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAgentContext,
  queryKnowledge,
  saveKnowledge,
  getBusinessContext,
  updateTaskStatus,
  createSubTask,
  complete,
  logAgentMessage,
  corsHeaders,
  respond,
} from '../_shared/agent-utils.ts'

const AGENT_ID = 'commander'

const SYSTEM_PROMPT = `You are Commander, the chief strategist of an AI marketing team for a business.

Your responsibilities:
1. Analyze business goals and current marketing state
2. Create strategic marketing plans and campaigns
3. Assign tasks to specialist agents:
   - Scout: Find leads and research prospects
   - Spy: Monitor competitors and market trends
   - Writer: Create content (posts, emails, articles)
   - Artist: Create visual content (images, graphics)
   - Broadcaster: Publish content to channels
   - Ambassador: Engage with audience and nurture leads
   - Oracle: Analyze performance and provide insights

4. Review work from other agents before approval
5. Learn from results and continuously improve strategies

When talking to users:
- Be helpful and proactive
- Explain your thinking
- Suggest next steps
- Keep responses concise but informative

Always think strategically. Consider ROI, timing, and resources.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ctx = createAgentContext(req)
    const body = await req.json()
    const { action, taskId, input, businessId } = body

    // Use businessId from body if not in query params
    if (businessId && !ctx.businessId) {
      ctx.businessId = businessId
    }

    ctx.taskId = taskId

    const business = await getBusinessContext(ctx)
    if (!business) {
      return respond({ success: false, error: 'Business not found' }, 404)
    }

    const relevantKnowledge = await queryKnowledge(
      ctx,
      `${business.name} marketing strategy goals audience products`,
      undefined,
      10
    )

    const businessContext = `
Business: ${business.name}
Website: ${business.website || 'Not set'}
Description: ${business.description || 'Not set'}
Products: ${JSON.stringify(business.products || [])}
Target Audience: ${JSON.stringify(business.target_audience || {})}
Brand Voice: ${JSON.stringify(business.brand_voice || {})}
Competitors: ${JSON.stringify(business.competitors || [])}
Autonomy Level: ${business.autonomy_level}

Relevant Knowledge:
${relevantKnowledge.join('\n\n')}
`

    let result: unknown

    switch (action) {
      case 'chat': {
        // Direct conversation with user
        const { message } = input

        await logAgentMessage(ctx, AGENT_ID, `User message: ${message}`)

        const response = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${businessContext}

The user is talking to you directly. Respond helpfully and proactively.

User: ${message}

Respond naturally. If they're asking for something you can do (analyze, create campaign, find leads, etc.), either do it directly or explain what you'll do. If you need to delegate to other agents, explain that.

Keep your response concise but helpful. Use bullet points sparingly and only when listing multiple items.`,
          { model: 'gpt-4o', temperature: 0.7 }
        )

        await logAgentMessage(ctx, AGENT_ID, `Response: ${response.substring(0, 100)}...`)

        result = { response }
        break
      }

      case 'analyze': {
        await logAgentMessage(ctx, AGENT_ID, 'Starting analysis of current marketing state')

        const analysis = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${businessContext}

Analyze the current marketing state for this business. Consider:
1. What are the key opportunities?
2. What are the gaps or weaknesses?
3. What should be the priorities?
4. What quick wins are available?

Respond in JSON format:
{
  "opportunities": ["..."],
  "gaps": ["..."],
  "priorities": ["..."],
  "quickWins": ["..."],
  "recommendedActions": [
    {
      "action": "...",
      "agent": "scout|spy|writer|artist|broadcaster|ambassador",
      "priority": 1-10,
      "reasoning": "..."
    }
  ]
}`,
          { model: 'gpt-4o', json: true }
        )

        await logAgentMessage(ctx, AGENT_ID, `Analysis complete: ${analysis.priorities?.length || 0} priorities identified`)
        result = analysis
        break
      }

      case 'plan_campaign': {
        const { goal, channels, duration, audience, campaignId } = input

        await logAgentMessage(ctx, AGENT_ID, `Planning campaign for goal: ${goal}`)

        const plan = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${businessContext}

Create a marketing campaign plan with:
Goal: ${goal}
Channels: ${channels?.join(', ') || 'All available'}
Duration: ${duration || '4 weeks'}
Target Audience: ${audience || 'Default target audience'}

Respond in JSON format:
{
  "name": "Campaign name",
  "description": "Brief description",
  "strategy": {
    "approach": "Overall approach",
    "keyMessages": ["..."],
    "contentThemes": ["..."],
    "postingFrequency": { "channel": "frequency" }
  },
  "phases": [
    {
      "week": 1,
      "focus": "...",
      "tasks": [
        {
          "type": "research|write|design|publish|engage|analyze",
          "title": "...",
          "description": "...",
          "assignTo": "scout|spy|writer|artist|broadcaster|ambassador|oracle",
          "priority": 1-10
        }
      ]
    }
  ],
  "successCriteria": ["..."],
  "estimatedResults": {
    "leads": "...",
    "engagement": "...",
    "conversions": "..."
  }
}`,
          { model: 'gpt-4o', json: true }
        )

        // If campaignId provided, update the campaign with the strategy
        if (campaignId) {
          await ctx.supabase
            .from('campaigns')
            .update({
              strategy: plan.strategy,
              description: plan.description,
            })
            .eq('id', campaignId)
        }

        await logAgentMessage(ctx, AGENT_ID, `Campaign plan created: ${plan.name}`)
        result = plan
        break
      }

      case 'create_tasks': {
        const { plan, campaignId } = input

        await logAgentMessage(ctx, AGENT_ID, `Creating tasks from plan`)

        const tasks = []
        for (const phase of plan.phases || []) {
          for (const taskDef of phase.tasks || []) {
            const task = await createSubTask(ctx, taskId!, {
              type: taskDef.type,
              title: taskDef.title,
              description: taskDef.description,
              assigned_to: taskDef.assignTo,
              priority: taskDef.priority,
              input: {
                campaignId,
                phase: phase.week,
                context: taskDef.context,
              },
            })
            if (task) tasks.push(task)
          }
        }

        await logAgentMessage(ctx, AGENT_ID, `Created ${tasks.length} tasks`)
        result = { tasksCreated: tasks.length, tasks }
        break
      }

      case 'review': {
        const { taskToReview, output } = input

        await logAgentMessage(ctx, AGENT_ID, `Reviewing task: ${taskToReview}`)

        const review = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${businessContext}

Review this work output:
${JSON.stringify(output, null, 2)}

Consider:
1. Does it align with brand voice and guidelines?
2. Is it high quality and professional?
3. Will it effectively reach the target audience?
4. Are there any issues or improvements needed?

Respond in JSON format:
{
  "approved": true/false,
  "quality": 1-10,
  "feedback": "...",
  "improvements": ["..."],
  "shouldPublish": true/false
}`,
          { model: 'gpt-4o', json: true }
        )

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Review complete: ${review.approved ? 'Approved' : 'Needs revision'}`
        )

        result = review
        break
      }

      case 'learn': {
        const { metrics, contentId, campaignId } = input

        await logAgentMessage(ctx, AGENT_ID, `Learning from performance data`)

        const learning = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${businessContext}

Analyze this performance data:
${JSON.stringify(metrics, null, 2)}

Extract learnings:
1. What worked well?
2. What didn't work?
3. What patterns do you see?
4. What should we do differently?

Respond in JSON format:
{
  "insights": ["..."],
  "whatWorked": ["..."],
  "whatDidnt": ["..."],
  "recommendations": ["..."],
  "summary": "One paragraph summary of key learnings"
}`,
          { model: 'gpt-4o', json: true }
        )

        await saveKnowledge(
          ctx,
          `Performance Learnings - ${new Date().toISOString().split('T')[0]}`,
          learning.summary + '\n\n' + learning.insights.join('\n'),
          'learning',
          AGENT_ID,
          ['performance', 'learning']
        )

        await logAgentMessage(ctx, AGENT_ID, `Learnings saved to knowledge base`)
        result = learning
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
    console.error('Commander error:', error)
    return respond({ success: false, error: error.message }, 500)
  }
})
