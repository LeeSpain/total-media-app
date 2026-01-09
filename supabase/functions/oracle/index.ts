// Oracle Agent - Analytics Expert
// Tracks performance and provides insights

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAgentContext,
  saveKnowledge,
  getBusinessContext,
  updateTaskStatus,
  complete,
  logAgentMessage,
  corsHeaders,
  respond,
} from '../_shared/agent-utils.ts'

const AGENT_ID = 'oracle'

const SYSTEM_PROMPT = `You are Oracle, the analytics expert for an AI marketing team.

Your mission is to turn data into wisdom. You:
1. Track performance metrics across all channels
2. Identify patterns and trends in the data
3. Report on campaign effectiveness
4. Recommend optimizations based on results
5. Feed learnings back to Commander

Numbers tell stories. Find the insights that drive better decisions.
Focus on actionable insights, not just data dumps.
Always connect metrics to business outcomes.`

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
      case 'analyze_performance': {
        const { timeframe = '7d', channels } = input

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Analyzing performance for past ${timeframe}`
        )

        // Calculate date range
        const days = parseInt(timeframe) || 7
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get analytics data
        const { data: analytics } = await ctx.supabase
          .from('analytics')
          .select('*')
          .eq('business_id', ctx.businessId)
          .gte('recorded_at', startDate.toISOString())

        // Get content performance
        const { data: content } = await ctx.supabase
          .from('content')
          .select('*, metrics')
          .eq('business_id', ctx.businessId)
          .eq('status', 'published')
          .gte('published_at', startDate.toISOString())

        // Get lead data
        const { data: leads } = await ctx.supabase
          .from('leads')
          .select('*')
          .eq('business_id', ctx.businessId)
          .gte('created_at', startDate.toISOString())

        const analysisInput = {
          analytics: analytics || [],
          content: content || [],
          leads: leads || [],
          timeframe,
        }

        const analysis = await complete(
          ctx,
          SYSTEM_PROMPT,
          `Analyze this marketing performance data:
${JSON.stringify(analysisInput, null, 2)}

Provide comprehensive analysis in JSON format:
{
  "summary": {
    "overallPerformance": "good|average|poor",
    "headline": "One-line summary",
    "keyMetrics": {
      "totalImpressions": 0,
      "totalEngagement": 0,
      "engagementRate": "0%",
      "leadsGenerated": 0,
      "conversionRate": "0%"
    }
  },
  "byChannel": {
    "channelName": {
      "impressions": 0,
      "engagement": 0,
      "performance": "above|at|below average",
      "trend": "up|stable|down"
    }
  },
  "topContent": [
    {
      "id": "...",
      "title": "...",
      "performance": "Why it performed well"
    }
  ],
  "bottomContent": [
    {
      "id": "...",
      "title": "...",
      "issue": "Why it underperformed"
    }
  ],
  "patterns": ["Patterns identified in the data"],
  "insights": [
    {
      "insight": "What we learned",
      "evidence": "Data supporting this",
      "action": "What to do about it"
    }
  ],
  "recommendations": [
    {
      "recommendation": "...",
      "priority": "high|medium|low",
      "expectedImpact": "...",
      "effort": "high|medium|low"
    }
  ],
  "alerts": ["Things that need immediate attention"]
}`,
          { model: 'gpt-4o', json: true }
        )

        // Save key insights to knowledge base
        if (analysis.insights && analysis.insights.length > 0) {
          await saveKnowledge(
            ctx,
            `Performance Insights - ${new Date().toISOString().split('T')[0]}`,
            analysis.insights.map((i: {insight: string, action: string}) => `${i.insight}: ${i.action}`).join('\n'),
            'learning',
            AGENT_ID,
            ['analytics', 'insights', 'performance']
          )
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Analysis complete: ${analysis.summary.overallPerformance} performance`
        )

        result = analysis
        break
      }

      case 'campaign_report': {
        const { campaignId } = input

        const { data: campaign, error } = await ctx.supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single()

        if (error || !campaign) {
          return respond({ success: false, error: 'Campaign not found' }, 404)
        }

        await logAgentMessage(ctx, AGENT_ID, `Generating report for: ${campaign.name}`)

        // Get campaign content
        const { data: content } = await ctx.supabase
          .from('content')
          .select('*')
          .eq('campaign_id', campaignId)

        // Get campaign analytics
        const { data: analytics } = await ctx.supabase
          .from('analytics')
          .select('*')
          .eq('campaign_id', campaignId)

        const report = await complete(
          ctx,
          SYSTEM_PROMPT,
          `Generate a campaign performance report:

Campaign: ${JSON.stringify(campaign, null, 2)}
Content: ${JSON.stringify(content, null, 2)}
Analytics: ${JSON.stringify(analytics, null, 2)}

Respond in JSON format:
{
  "campaignName": "${campaign.name}",
  "status": "on-track|behind|ahead|completed",
  "summary": "Executive summary paragraph",
  "goalProgress": {
    "goal": "${campaign.goal}",
    "progress": "0%",
    "status": "on-track|at-risk|behind"
  },
  "metrics": {
    "impressions": { "value": 0, "trend": "up|down|stable", "vsGoal": "+/-%" },
    "engagement": { "value": 0, "trend": "...", "vsGoal": "..." },
    "leads": { "value": 0, "trend": "...", "vsGoal": "..." },
    "conversions": { "value": 0, "trend": "...", "vsGoal": "..." }
  },
  "contentPerformance": {
    "totalPieces": 0,
    "published": 0,
    "avgEngagement": 0,
    "topPerformer": { "id": "...", "title": "...", "performance": "..." }
  },
  "channelBreakdown": {
    "channel": { "performance": "...", "contribution": "%" }
  },
  "learnings": ["What we learned from this campaign"],
  "recommendations": ["What to do next"],
  "nextSteps": ["Immediate actions"]
}`,
          { model: 'gpt-4o', json: true }
        )

        await logAgentMessage(ctx, AGENT_ID, `Campaign report generated`)

        result = report
        break
      }

      case 'track_metrics': {
        const { contentId, metrics } = input

        await logAgentMessage(ctx, AGENT_ID, `Recording metrics for content`)

        // Save metrics to analytics table
        const records = Object.entries(metrics).map(([metric, value]) => ({
          business_id: ctx.businessId,
          content_id: contentId,
          channel: 'mixed',
          metric,
          value: value as number,
          recorded_at: new Date().toISOString(),
        }))

        const { error } = await ctx.supabase.from('analytics').insert(records)

        if (error) throw error

        // Update content metrics
        await ctx.supabase
          .from('content')
          .update({ metrics })
          .eq('id', contentId)

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Recorded ${records.length} metrics`
        )

        result = { recorded: records.length, metrics }
        break
      }

      case 'identify_patterns': {
        const { dataType = 'all', timeframe = '30d' } = input

        await logAgentMessage(ctx, AGENT_ID, `Identifying patterns in ${dataType} data`)

        const days = parseInt(timeframe) || 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Gather relevant data
        const { data: analytics } = await ctx.supabase
          .from('analytics')
          .select('*')
          .eq('business_id', ctx.businessId)
          .gte('recorded_at', startDate.toISOString())

        const { data: content } = await ctx.supabase
          .from('content')
          .select('*')
          .eq('business_id', ctx.businessId)
          .eq('status', 'published')

        const patterns = await complete(
          ctx,
          SYSTEM_PROMPT,
          `Identify patterns in this marketing data:

Analytics: ${JSON.stringify(analytics, null, 2)}
Content: ${JSON.stringify(content, null, 2)}

Look for:
- Timing patterns (when does content perform best)
- Content patterns (what types/topics work)
- Audience patterns (who engages most)
- Channel patterns (where we succeed)
- Correlation patterns (what leads to what)

Respond in JSON format:
{
  "timingPatterns": [
    { "pattern": "...", "evidence": "...", "recommendation": "..." }
  ],
  "contentPatterns": [
    { "pattern": "...", "evidence": "...", "recommendation": "..." }
  ],
  "audiencePatterns": [
    { "pattern": "...", "evidence": "...", "recommendation": "..." }
  ],
  "channelPatterns": [
    { "pattern": "...", "evidence": "...", "recommendation": "..." }
  ],
  "correlations": [
    { "correlation": "X leads to Y", "strength": "strong|moderate|weak", "actionable": true/false }
  ],
  "anomalies": ["Unusual things noticed"],
  "strategicInsights": ["High-level strategic takeaways"]
}`,
          { model: 'gpt-4o', json: true }
        )

        // Save patterns to knowledge
        await saveKnowledge(
          ctx,
          `Pattern Analysis - ${new Date().toISOString().split('T')[0]}`,
          JSON.stringify(patterns, null, 2),
          'learning',
          AGENT_ID,
          ['patterns', 'analysis']
        )

        await logAgentMessage(ctx, AGENT_ID, `Pattern analysis complete`)

        result = patterns
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
    console.error('Oracle error:', error)
    return respond({ success: false, error: error.message }, 500)
  }
})
