// Writer Agent - Content Creator
// Creates compelling copy across all channels

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

const AGENT_ID = 'writer'

const SYSTEM_PROMPT = `You are Writer, the content creator for an AI marketing team.

Your mission is to create compelling marketing content that:
1. Engages the target audience
2. Maintains consistent brand voice
3. Drives action (clicks, signups, purchases)
4. Tells authentic stories
5. Provides genuine value

Content Types:
- Social media posts (Twitter, LinkedIn, Instagram, Facebook)
- Email campaigns (subject lines, body copy)
- Blog articles
- Ad copy
- Video scripts

Always:
- Match the brand voice and tone
- Use clear, concise language
- Include calls to action
- Create emotional connection
- Be authentic, never salesy or pushy`

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

    // Get brand voice and content examples
    const brandKnowledge = await queryKnowledge(
      ctx,
      'brand voice tone examples content style',
      'brand',
      5
    )

    const brandContext = `
Business: ${business.name}
Description: ${business.description}
Products: ${JSON.stringify(business.products)}
Target Audience: ${JSON.stringify(business.target_audience)}

Brand Voice:
${JSON.stringify(business.brand_voice, null, 2)}

Content Guidelines:
${brandKnowledge.join('\n\n')}
`

    let result: unknown

    switch (action) {
      case 'social_posts': {
        // Create social media posts
        const { channel, topic, count = 5, includeImages = false } = input

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Creating ${count} ${channel} posts about: ${topic}`
        )

        const channelGuidelines = {
          twitter: 'Max 280 characters. Punchy, conversational. Use hashtags sparingly.',
          linkedin: 'Professional tone. Can be longer. Focus on value and insights.',
          instagram: 'Visual-first. Use emojis. Max 2200 chars. Strong first line.',
          facebook: 'Conversational. Can be longer. Questions work well.',
        }

        const posts = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Create ${count} ${channel} posts about: ${topic}

Channel guidelines: ${channelGuidelines[channel as keyof typeof channelGuidelines] || 'Standard social media best practices'}

Respond in JSON format:
{
  "posts": [
    {
      "body": "Post content...",
      "hashtags": ["..."],
      "suggestedImagePrompt": "DALL-E prompt for accompanying image" ${includeImages ? '' : '(optional)'},
      "bestTimeToPost": "Suggested posting time",
      "callToAction": "What action we want readers to take"
    }
  ],
  "contentTheme": "Overall theme of these posts",
  "targetEmotion": "What emotion we're trying to evoke"
}`,
          { model: 'claude-3-5-sonnet-20241022', json: true }
        )

        // Save posts to content table
        const savedPosts = []
        for (const post of posts.posts) {
          const { data, error } = await ctx.supabase
            .from('content')
            .insert({
              business_id: ctx.businessId,
              task_id: taskId,
              type: 'social_post',
              channel,
              body: post.body + (post.hashtags?.length ? '\n\n' + post.hashtags.map((h: string) => `#${h}`).join(' ') : ''),
              status: 'review',
              created_by: AGENT_ID,
            })
            .select()
            .single()

          if (!error && data) {
            savedPosts.push({ ...data, metadata: post })
          }
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Created ${savedPosts.length} posts, awaiting review`
        )

        result = { posts: savedPosts, metadata: posts }
        break
      }

      case 'email': {
        // Create email content
        const { type, topic, tone = 'professional' } = input

        await logAgentMessage(ctx, AGENT_ID, `Creating ${type} email about: ${topic}`)

        const email = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Create a ${type} email about: ${topic}
Tone: ${tone}

Types:
- welcome: New subscriber/customer welcome
- nurture: Relationship building, value-add
- promotional: Product/service promotion
- newsletter: Updates and news
- reengagement: Win back inactive subscribers

Respond in JSON format:
{
  "subjectLines": [
    "Subject line option 1",
    "Subject line option 2",
    "Subject line option 3"
  ],
  "preheader": "Preview text that appears after subject",
  "body": {
    "opening": "Opening paragraph that hooks the reader",
    "main": "Main content - can be multiple paragraphs",
    "callToAction": "Clear CTA text",
    "closing": "Sign-off"
  },
  "htmlContent": "Full HTML email content",
  "plainTextContent": "Plain text version",
  "suggestedSendTime": "Best time to send",
  "segmentSuggestion": "Who should receive this"
}`,
          { model: 'claude-3-5-sonnet-20241022', json: true }
        )

        // Save email to content table
        const { data: savedEmail, error } = await ctx.supabase
          .from('content')
          .insert({
            business_id: ctx.businessId,
            task_id: taskId,
            type: 'email',
            channel: 'email',
            title: email.subjectLines[0],
            body: email.htmlContent,
            status: 'review',
            created_by: AGENT_ID,
          })
          .select()
          .single()

        if (error) throw error

        await logAgentMessage(ctx, AGENT_ID, `Email created, awaiting review`)

        result = { email: savedEmail, metadata: email }
        break
      }

      case 'blog': {
        // Create blog article
        const { topic, keywords = [], length = 'medium' } = input

        await logAgentMessage(ctx, AGENT_ID, `Creating blog article: ${topic}`)

        const wordCounts = { short: 500, medium: 1000, long: 2000 }

        const article = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Write a blog article about: ${topic}
Target keywords: ${keywords.join(', ')}
Target length: ~${wordCounts[length as keyof typeof wordCounts]} words

The article should:
- Provide genuine value to readers
- Be SEO-optimized but readable
- Include practical insights
- Match brand voice

Respond in JSON format:
{
  "title": "Compelling headline",
  "metaDescription": "SEO meta description (155 chars max)",
  "slug": "url-friendly-slug",
  "excerpt": "Short preview/excerpt",
  "body": "Full article content in markdown format",
  "headings": ["H2 headings used"],
  "keywords": ["keywords naturally included"],
  "suggestedImages": ["Image ideas for the article"],
  "callToAction": "End CTA",
  "relatedTopics": ["Topics to link to or write next"]
}`,
          { model: 'claude-3-5-sonnet-20241022', json: true }
        )

        // Save article
        const { data: savedArticle, error } = await ctx.supabase
          .from('content')
          .insert({
            business_id: ctx.businessId,
            task_id: taskId,
            type: 'blog_article',
            channel: 'blog',
            title: article.title,
            body: article.body,
            status: 'review',
            created_by: AGENT_ID,
          })
          .select()
          .single()

        if (error) throw error

        await logAgentMessage(ctx, AGENT_ID, `Blog article created, awaiting review`)

        result = { article: savedArticle, metadata: article }
        break
      }

      case 'variations': {
        // Create variations of existing content
        const { contentId, count = 3 } = input

        const { data: originalContent, error } = await ctx.supabase
          .from('content')
          .select('*')
          .eq('id', contentId)
          .single()

        if (error || !originalContent) {
          return respond({ success: false, error: 'Content not found' }, 404)
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Creating ${count} variations of content`
        )

        const variations = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Create ${count} variations of this content:
Type: ${originalContent.type}
Channel: ${originalContent.channel}
Original: ${originalContent.body}

Each variation should:
- Keep the core message
- Try different angles/hooks
- Maintain brand voice
- Be distinct from others

Respond in JSON format:
{
  "variations": [
    {
      "body": "Variation content",
      "angle": "What's different about this version",
      "testHypothesis": "Why this might work better"
    }
  ]
}`,
          { json: true }
        )

        await logAgentMessage(
          ctx,
          AGENT_ID,
          `Created ${variations.variations.length} variations`
        )

        result = { original: originalContent, variations: variations.variations }
        break
      }

      default:
        return respond({ success: false, error: `Unknown action: ${action}` }, 400)
    }

    if (taskId) {
      await updateTaskStatus(ctx, taskId, 'review', result)
    }

    return respond({ success: true, data: result })
  } catch (error) {
    console.error('Writer error:', error)
    return respond({ success: false, error: error.message }, 500)
  }
})
