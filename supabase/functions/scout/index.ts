// Scout Agent - Lead Researcher
// Discovers and qualifies potential leads

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

const AGENT_ID = 'scout'

const SYSTEM_PROMPT = `You are Scout, the lead researcher for an AI marketing team.

Your mission is to find and qualify potential customers. You:
1. Search for companies and contacts matching target criteria
2. Extract and validate contact information
3. Qualify leads based on fit and intent signals
4. Score leads on conversion potential
5. Enrich leads with relevant context

Be thorough but efficient. Quality over quantity.
Focus on finding leads that genuinely match the target audience.
Always validate information before saving.`

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

    // Get target audience info
    const audienceKnowledge = await queryKnowledge(
      ctx,
      'target audience ideal customer profile',
      'audience',
      5
    )

    const audienceContext = `
Target Audience: ${JSON.stringify(business.target_audience)}
Products/Services: ${JSON.stringify(business.products)}

Additional Audience Knowledge:
${audienceKnowledge.join('\n')}
`

    let result: unknown

    switch (action) {
      case 'discover': {
        // Discover new leads based on criteria
        const { industry, location, keywords, maxLeads = 10 } = input

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Starting lead discovery: ${industry} in ${location}`
        )

        // Generate search strategy
        const searchStrategy = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${audienceContext}

I need to find potential leads with these criteria:
- Industry: ${industry}
- Location: ${location}
- Keywords: ${keywords?.join(', ') || 'N/A'}
- Max leads to find: ${maxLeads}

Generate a search strategy in JSON format:
{
  "searchQueries": ["..."],  // Google search queries to find companies
  "websitePatterns": ["..."], // Patterns to identify good prospects
  "qualificationCriteria": ["..."], // How to qualify a lead
  "redFlags": ["..."]  // Signs a lead is not a good fit
}`,
          { json: true }
        )

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Search strategy created with ${searchStrategy.searchQueries.length} queries`
        )

        // Note: In production, this would call actual web scraping APIs
        // For now, we generate realistic sample leads using AI
        const discoveredLeads = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${audienceContext}

Based on this search strategy:
${JSON.stringify(searchStrategy, null, 2)}

Generate ${maxLeads} realistic potential leads in JSON format:
{
  "leads": [
    {
      "name": "Contact name",
      "email": "email@company.com",
      "company": "Company Name",
      "jobTitle": "Job Title",
      "website": "https://...",
      "linkedinUrl": "https://linkedin.com/in/...",
      "source": "research",
      "sourceDetails": "How we found them",
      "score": 1-100,
      "tags": ["..."],
      "notes": "Why they're a good fit",
      "enrichmentData": {
        "companyInfo": {
          "size": "...",
          "industry": "...",
          "location": "..."
        }
      }
    }
  ]
}

Make the leads realistic and relevant to the target audience.
Score them based on how well they match the ideal customer profile.`,
          { model: 'gpt-4o', json: true }
        )

        // Save leads to database
        const savedLeads = []
        for (const lead of discoveredLeads.leads) {
          const { data, error } = await ctx.supabase
            .from('leads')
            .insert({
              business_id: ctx.businessId,
              name: lead.name,
              email: lead.email,
              company: lead.company,
              job_title: lead.jobTitle,
              website: lead.website,
              linkedin_url: lead.linkedinUrl,
              source: lead.source,
              source_details: lead.sourceDetails,
              score: lead.score,
              tags: lead.tags,
              notes: lead.notes,
              enrichment_data: lead.enrichmentData,
              status: 'new',
            })
            .select()
            .single()

          if (!error && data) {
            savedLeads.push(data)
          }
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Discovered and saved ${savedLeads.length} leads`
        )

        result = {
          leadsFound: discoveredLeads.leads.length,
          leadsSaved: savedLeads.length,
          leads: savedLeads,
          searchStrategy,
        }
        break
      }

      case 'enrich': {
        // Enrich existing lead with more data
        const { leadId } = input

        const { data: lead, error } = await ctx.supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single()

        if (error || !lead) {
          return respond({ success: false, error: 'Lead not found' }, 404)
        }

        await logAgentMessage(ctx, AGENT_ID, `Enriching lead: ${lead.name}`)

        // Generate enrichment data
        const enrichment = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${audienceContext}

Enrich this lead with additional information:
${JSON.stringify(lead, null, 2)}

Generate enrichment data in JSON format:
{
  "companyInfo": {
    "size": "...",
    "industry": "...",
    "revenue": "...",
    "location": "...",
    "founded": "...",
    "description": "..."
  },
  "socialProfiles": {
    "twitter": "...",
    "linkedin": "...",
    "facebook": "..."
  },
  "technologyStack": ["..."],
  "recentNews": ["..."],
  "competitorOf": ["..."],
  "buyingSignals": ["..."],
  "updatedScore": 1-100,
  "scoreReasoning": "..."
}

Be realistic with the data. If something is unknown, omit it.`,
          { json: true }
        )

        // Update lead with enrichment
        const { error: updateError } = await ctx.supabase
          .from('leads')
          .update({
            enrichment_data: enrichment,
            score: enrichment.updatedScore || lead.score,
          })
          .eq('id', leadId)

        if (updateError) {
          throw new Error(`Failed to update lead: ${updateError.message}`)
        }

        await logAgentMessage(ctx, AGENT_ID, `Lead enriched, new score: ${enrichment.updatedScore}`)

        result = { leadId, enrichment }
        break
      }

      case 'qualify': {
        // Qualify a batch of leads
        const { leadIds } = input

        await logAgentMessage(ctx, AGENT_ID, `Qualifying ${leadIds.length} leads`)

        const { data: leads, error } = await ctx.supabase
          .from('leads')
          .select('*')
          .in('id', leadIds)

        if (error) throw error

        const qualification = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${audienceContext}

Qualify these leads and categorize them:
${JSON.stringify(leads, null, 2)}

Respond in JSON format:
{
  "qualified": [
    { "id": "...", "score": 80-100, "reason": "..." }
  ],
  "maybeQualified": [
    { "id": "...", "score": 50-79, "reason": "...", "needsMoreInfo": ["..."] }
  ],
  "notQualified": [
    { "id": "...", "score": 0-49, "reason": "..." }
  ],
  "summary": "Brief summary of qualification results"
}`,
          { json: true }
        )

        // Update lead statuses based on qualification
        for (const q of qualification.qualified) {
          await ctx.supabase
            .from('leads')
            .update({ status: 'qualified', score: q.score })
            .eq('id', q.id)
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Qualified ${qualification.qualified.length} leads`
        )

        result = qualification
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
    console.error('Scout error:', error)
    return respond({ success: false, error: error.message }, 500)
  }
})
