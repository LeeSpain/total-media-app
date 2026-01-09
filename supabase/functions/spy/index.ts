// Spy Agent - Market Intelligence
// Monitors competitors and identifies opportunities

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAgentContext,
  queryKnowledge,
  saveKnowledge,
  getBusinessContext,
  updateTaskStatus,
  complete,
  logAgentMessage,
  corsHeaders,
  respond,
} from '../_shared/agent-utils.ts'

const AGENT_ID = 'spy'

const SYSTEM_PROMPT = `You are Spy, the market intelligence agent for an AI marketing team.

Your mission is to gather competitive intelligence and market insights:
1. Monitor competitor activities (content, campaigns, positioning)
2. Track industry trends and news
3. Identify market opportunities and threats
4. Analyze competitor strategies
5. Surface actionable insights

Be vigilant. Connect the dots. Surface what matters.
Always provide context for why information is relevant.`

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

    const competitorKnowledge = await queryKnowledge(
      ctx,
      'competitors market industry trends',
      'competitor',
      5
    )

    const marketContext = `
Business: ${business.name}
Industry: ${business.description}
Known Competitors: ${JSON.stringify(business.competitors)}

Previous Intelligence:
${competitorKnowledge.join('\n\n')}
`

    let result: unknown

    switch (action) {
      case 'analyze_competitor': {
        const { competitorName, competitorWebsite } = input

        await logAgentMessage(ctx, AGENT_ID, `Analyzing competitor: ${competitorName}`)

        const analysis = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${marketContext}

Analyze this competitor:
Name: ${competitorName}
Website: ${competitorWebsite}

Provide comprehensive competitive analysis in JSON format:
{
  "overview": {
    "name": "...",
    "positioning": "How they position themselves",
    "targetAudience": "Who they target",
    "uniqueSellingPoints": ["..."]
  },
  "products": [
    {
      "name": "...",
      "description": "...",
      "pricing": "...",
      "strengths": ["..."],
      "weaknesses": ["..."]
    }
  ],
  "marketing": {
    "channels": ["Active marketing channels"],
    "contentStrategy": "Description of their content approach",
    "messagingThemes": ["Key messages they use"],
    "toneAndVoice": "How they communicate"
  },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["How we can differentiate or compete"],
  "threats": ["What they do better"],
  "actionableInsights": [
    {
      "insight": "...",
      "recommendation": "...",
      "priority": "high|medium|low"
    }
  ]
}`,
          { model: 'gpt-4o', json: true }
        )

        // Save to knowledge base
        await saveKnowledge(
          ctx,
          `Competitor Analysis: ${competitorName}`,
          JSON.stringify(analysis, null, 2),
          'competitor',
          AGENT_ID,
          ['competitor', competitorName.toLowerCase()]
        )

        await logAgentMessage(ctx, AGENT_ID, `Competitor analysis complete, saved to knowledge base`)

        result = analysis
        break
      }

      case 'market_trends': {
        const { industry, timeframe = 'current' } = input

        await logAgentMessage(ctx, AGENT_ID, `Researching market trends: ${industry}`)

        const trends = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${marketContext}

Research current market trends for: ${industry}
Timeframe: ${timeframe}

Provide trend analysis in JSON format:
{
  "industryOverview": "Current state of the industry",
  "trends": [
    {
      "trend": "Trend name/description",
      "impact": "high|medium|low",
      "timeframe": "emerging|growing|mature|declining",
      "relevance": "Why this matters for our business",
      "opportunities": ["How to capitalize"],
      "risks": ["Potential downsides"]
    }
  ],
  "emergingTechnologies": ["..."],
  "consumerBehaviorShifts": ["..."],
  "regulatoryChanges": ["..."],
  "recommendations": [
    {
      "action": "...",
      "priority": "high|medium|low",
      "reasoning": "..."
    }
  ],
  "summary": "Executive summary of key findings"
}`,
          { model: 'gpt-4o', json: true }
        )

        await saveKnowledge(
          ctx,
          `Market Trends: ${industry} - ${new Date().toISOString().split('T')[0]}`,
          trends.summary + '\n\n' + trends.trends.map((t: any) => `- ${t.trend}: ${t.relevance}`).join('\n'),
          'research',
          AGENT_ID,
          ['trends', 'market', industry.toLowerCase()]
        )

        await logAgentMessage(ctx, AGENT_ID, `Found ${trends.trends.length} relevant trends`)

        result = trends
        break
      }

      case 'opportunity_scan': {
        await logAgentMessage(ctx, AGENT_ID, `Scanning for market opportunities`)

        const opportunities = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${marketContext}

Scan for market opportunities for this business. Consider:
- Gaps in competitor offerings
- Underserved customer segments
- Emerging needs
- Content/marketing gaps
- Partnership possibilities

Provide opportunity analysis in JSON format:
{
  "marketGaps": [
    {
      "gap": "Description of the gap",
      "evidence": "Why we believe this gap exists",
      "opportunity": "How to capitalize",
      "effort": "high|medium|low",
      "potential": "high|medium|low"
    }
  ],
  "underservedSegments": [
    {
      "segment": "...",
      "currentlyServedBy": "Who serves them now (poorly)",
      "ourAdvantage": "Why we could do better"
    }
  ],
  "contentOpportunities": [
    {
      "topic": "...",
      "format": "blog|video|social|email",
      "reasoning": "Why this would work"
    }
  ],
  "quickWins": ["Immediate opportunities"],
  "strategicPlays": ["Longer-term opportunities"],
  "prioritizedActions": [
    {
      "action": "...",
      "timeline": "...",
      "expectedImpact": "..."
    }
  ]
}`,
          { model: 'gpt-4o', json: true }
        )

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Found ${opportunities.marketGaps.length} market gaps and ${opportunities.quickWins.length} quick wins`
        )

        result = opportunities
        break
      }

      case 'monitor_news': {
        const { topics = [], competitors = [] } = input

        await logAgentMessage(ctx, AGENT_ID, `Monitoring news for relevant updates`)

        // In production, this would integrate with news APIs
        const newsDigest = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${marketContext}

Generate a simulated news monitoring digest for:
Topics: ${topics.join(', ') || 'industry news'}
Competitors: ${competitors.join(', ') || 'known competitors'}

Provide news digest in JSON format:
{
  "digest": [
    {
      "headline": "...",
      "source": "...",
      "date": "...",
      "summary": "...",
      "relevance": "Why this matters",
      "actionRequired": true/false,
      "suggestedAction": "..."
    }
  ],
  "competitorMoves": [
    {
      "competitor": "...",
      "action": "What they did",
      "implications": "What it means for us"
    }
  ],
  "industryShifts": ["..."],
  "urgentAlerts": ["Things needing immediate attention"],
  "summary": "Overall digest summary"
}`,
          { json: true }
        )

        await logAgentMessage(ctx, AGENT_ID, `News digest compiled`)

        result = newsDigest
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
    console.error('Spy error:', error)
    return respond({ success: false, error: error.message }, 500)
  }
})
