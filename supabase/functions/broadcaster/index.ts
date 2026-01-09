// Broadcaster Agent - Distribution Manager
// Publishes and schedules content across all channels

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAgentContext,
  getBusinessContext,
  updateTaskStatus,
  complete,
  logAgentMessage,
  corsHeaders,
  respond,
} from '../_shared/agent-utils.ts'

const AGENT_ID = 'broadcaster'

const SYSTEM_PROMPT = `You are Broadcaster, the distribution manager for an AI marketing team.

Your mission is to get content out to the world effectively. You:
1. Publish content to social media platforms
2. Send email campaigns
3. Schedule content for optimal timing
4. Manage posting queues
5. Handle publishing errors and retries

Timing is everything. Get the right content to the right place at the right time.
Consider timezone, audience activity patterns, and platform best practices.`

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

    let result: unknown

    switch (action) {
      case 'schedule': {
        const { contentIds, strategy = 'optimal' } = input

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Scheduling ${contentIds.length} pieces of content`
        )

        // Get content to schedule
        const { data: contents, error } = await ctx.supabase
          .from('content')
          .select('*')
          .in('id', contentIds)
          .eq('status', 'approved')

        if (error) throw error

        // Generate optimal schedule
        const schedule = await complete(
          ctx,
          SYSTEM_PROMPT,
          `Create a publishing schedule for this content:
${JSON.stringify(contents, null, 2)}

Strategy: ${strategy}
- optimal: Best times based on platform and audience
- spread: Evenly distributed
- burst: Concentrated for maximum impact

Consider:
- Platform best practices
- Audience timezone (assume mixed global)
- Content type and urgency
- Avoid posting too frequently

Respond in JSON format:
{
  "schedule": [
    {
      "contentId": "...",
      "scheduledFor": "ISO datetime",
      "platform": "...",
      "reasoning": "Why this time"
    }
  ],
  "strategy": "Summary of scheduling approach",
  "expectedReach": "Estimated reach",
  "tips": ["Publishing tips"]
}`,
          { json: true }
        )

        // Update content with scheduled times
        for (const item of schedule.schedule) {
          await ctx.supabase
            .from('content')
            .update({
              scheduled_for: item.scheduledFor,
              status: 'scheduled',
            })
            .eq('id', item.contentId)
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Scheduled ${schedule.schedule.length} items`
        )

        result = schedule
        break
      }

      case 'publish': {
        const { contentId } = input

        await logAgentMessage(ctx, AGENT_ID, `Publishing content: ${contentId}`)

        const { data: content, error } = await ctx.supabase
          .from('content')
          .select('*')
          .eq('id', contentId)
          .single()

        if (error || !content) {
          return respond({ success: false, error: 'Content not found' }, 404)
        }

        // Get connection for the platform
        const { data: connection } = await ctx.supabase
          .from('connections')
          .select('*')
          .eq('business_id', ctx.businessId)
          .eq('platform', content.channel)
          .eq('status', 'active')
          .single()

        if (!connection) {
          // No active connection - mark as failed
          await ctx.supabase
            .from('content')
            .update({
              status: 'failed',
              error_message: `No active ${content.channel} connection`,
            })
            .eq('id', contentId)

          return respond({
            success: false,
            error: `No active connection for ${content.channel}`,
          })
        }

        // In production, this would call actual platform APIs
        // For now, simulate successful publishing
        const publishResult = {
          success: true,
          externalId: `sim_${Date.now()}`,
          externalUrl: `https://${content.channel}.com/post/sim_${Date.now()}`,
          publishedAt: new Date().toISOString(),
        }

        // Update content status
        await ctx.supabase
          .from('content')
          .update({
            status: 'published',
            published_at: publishResult.publishedAt,
            external_id: publishResult.externalId,
            external_url: publishResult.externalUrl,
          })
          .eq('id', contentId)

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Published to ${content.channel}: ${publishResult.externalUrl}`
        )

        result = publishResult
        break
      }

      case 'send_email': {
        const { contentId, recipientList, testMode = false } = input

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Sending email${testMode ? ' (test mode)' : ''}`
        )

        const { data: content, error } = await ctx.supabase
          .from('content')
          .select('*')
          .eq('id', contentId)
          .single()

        if (error || !content) {
          return respond({ success: false, error: 'Content not found' }, 404)
        }

        // In production, this would integrate with email provider (Resend, SendGrid)
        const sendResult = {
          success: true,
          messageId: `msg_${Date.now()}`,
          recipientCount: testMode ? 1 : recipientList?.length || 0,
          sentAt: new Date().toISOString(),
          testMode,
        }

        if (!testMode) {
          await ctx.supabase
            .from('content')
            .update({
              status: 'published',
              published_at: sendResult.sentAt,
              external_id: sendResult.messageId,
            })
            .eq('id', contentId)
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Email sent to ${sendResult.recipientCount} recipients`
        )

        result = sendResult
        break
      }

      case 'check_queue': {
        // Check and process scheduled content
        await logAgentMessage(ctx, AGENT_ID, 'Checking publishing queue')

        const now = new Date().toISOString()

        const { data: dueContent, error } = await ctx.supabase
          .from('content')
          .select('*')
          .eq('business_id', ctx.businessId)
          .eq('status', 'scheduled')
          .lte('scheduled_for', now)

        if (error) throw error

        const published = []
        const failed = []

        for (const content of dueContent || []) {
          // Attempt to publish each item
          try {
            // Simulate publishing
            await ctx.supabase
              .from('content')
              .update({
                status: 'published',
                published_at: new Date().toISOString(),
                external_id: `auto_${Date.now()}`,
              })
              .eq('id', content.id)

            published.push(content.id)
          } catch (e) {
            failed.push({ id: content.id, error: e.message })
          }
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Queue processed: ${published.length} published, ${failed.length} failed`
        )

        result = {
          processed: dueContent?.length || 0,
          published,
          failed,
        }
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
    console.error('Broadcaster error:', error)
    return respond({ success: false, error: error.message }, 500)
  }
})
