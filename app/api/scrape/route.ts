import { NextResponse } from 'next/server'
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js'
import OpenAI from 'openai'

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || ''
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const scrapeResult = await firecrawl.scrapeUrl(url, { 
      formats: ['markdown', 'html'] 
    }) as ScrapeResponse

    if (!scrapeResult.success) {
      return NextResponse.json(
        { error: `Failed to scrape: ${scrapeResult.error}` },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "user", 
          content: `Based on this content, create a clear markdown document that explains:

1. What this technology/tool/service is
2. What problems it solves
3. How it works
4. Key features and capabilities
5. Common use cases

Format your response as clean markdown. For code blocks, ensure they are properly fenced with triple backticks and language identifiers.
Do not include any metadata or frontmatter.

Content to analyze:

${scrapeResult.markdown}`
        }
      ]
    })

    // Clean up the markdown response
    const formattedContent = completion.choices[0].message.content
      ?.trim()
      .replace(/^```markdown\s*/, '') // Remove opening markdown fence if present
      .replace(/\s*```$/, '') // Remove closing fence if present
      || ''

    return NextResponse.json({
      success: true,
      content: {
        markdown: formattedContent,
        title: scrapeResult.metadata?.title || '',
        description: scrapeResult.metadata?.description || '',
        url: url
      },
      metadata: {
        total: 1,
        completed: 1,
        creditsUsed: 1,
        expiresAt: new Date().toISOString(),
        hasMore: false
      }
    })

  } catch (error) {
    console.error('Error processing content:', error)
    return NextResponse.json({ error: 'Failed to process content' }, { status: 500 })
  }
} 