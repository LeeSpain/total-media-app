// Artist Agent - Visual Creator
// Creates images, graphics, and visual content

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

const AGENT_ID = 'artist'

const SYSTEM_PROMPT = `You are Artist, the visual creator for an AI marketing team.

Your mission is to create compelling visual content that:
1. Captures attention and stops the scroll
2. Communicates key messages visually
3. Maintains brand consistency
4. Evokes the right emotions
5. Supports marketing goals

You create:
- Social media images
- Ad graphics
- Blog post images
- Infographics concepts
- Video thumbnails
- Brand visuals

Always consider brand colors, style, and target audience.
Visual impact matters. Make people stop scrolling.`

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

    const brandKnowledge = await queryKnowledge(
      ctx,
      'brand visual style colors imagery',
      'brand',
      3
    )

    const brandContext = `
Business: ${business.name}
Description: ${business.description}
Brand Voice: ${JSON.stringify(business.brand_voice)}
Target Audience: ${JSON.stringify(business.target_audience)}

Visual Guidelines:
${brandKnowledge.join('\n')}
`

    let result: unknown

    switch (action) {
      case 'generate_image': {
        const { purpose, description, style, size = '1024x1024' } = input

        await logAgentMessage(ctx, AGENT_ID, `Generating image for: ${purpose}`)

        const promptOptimization = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Create an optimized DALL-E prompt for this image:
Purpose: ${purpose}
Description: ${description}
Style preference: ${style || 'professional, modern'}

Respond in JSON format:
{
  "optimizedPrompt": "Detailed DALL-E prompt...",
  "styleNotes": "Visual style recommendations",
  "colorPalette": ["Suggested colors"],
  "mood": "The mood/feeling to convey"
}`,
          { json: true }
        )

        let imageUrl = null
        try {
          const imageResponse = await ctx.openai.images.generate({
            model: 'dall-e-3',
            prompt: promptOptimization.optimizedPrompt,
            n: 1,
            size: size as '1024x1024' | '1792x1024' | '1024x1792',
            quality: 'standard',
          })
          imageUrl = imageResponse.data[0]?.url
        } catch (imageError) {
          console.error('Image generation failed:', imageError)
        }

        await logAgentMessage(
          ctx,
          AGENT_ID,
          imageUrl ? 'Image generated successfully' : 'Image prompt created'
        )

        result = { imageUrl, prompt: promptOptimization.optimizedPrompt, metadata: promptOptimization }
        break
      }

      case 'social_graphics': {
        const { channel, contentType, message, count = 3 } = input

        await logAgentMessage(ctx, AGENT_ID, `Creating ${count} graphics for ${channel}`)

        const graphicConcepts = await complete(
          ctx,
          SYSTEM_PROMPT,
          `${brandContext}

Create ${count} graphic concepts for ${channel}
Content type: ${contentType}
Message: ${message}

Respond in JSON format:
{
  "concepts": [
    {
      "name": "Concept name",
      "description": "What the graphic shows",
      "dallePrompt": "Optimized DALL-E prompt",
      "textOverlay": { "headline": "...", "cta": "..." },
      "mood": "Emotional tone"
    }
  ],
  "recommendation": "Which concept to prioritize"
}`,
          { json: true }
        )

        result = { concepts: graphicConcepts.concepts, recommendation: graphicConcepts.recommendation }
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
    console.error('Artist error:', error)
    return respond({ success: false, error: error.message }, 500)
  }
})
