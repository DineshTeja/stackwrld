import { NextResponse } from 'next/server'
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js'
import Groq from 'groq-sdk'
import { initialContent } from '@/lib/data/initialContent'

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || ''
})

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const processContent = async (scrapeResult: ScrapeResponse) => {
  console.log('Starting content processing...')
  const startTime = Date.now()

  try {
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "generate_tiptap_content",
          description: "Generate TipTap document structure from content",
          parameters: {
            type: "object",
            properties: {
              tiptap: {
                type: "object",
                description: "TipTap document structure with title, sections, and content"
              }
            },
            required: ["tiptap"]
          }
        }
      }
    ]

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a document processor that creates structured content. Generate a concise overview in TipTap JSON format."
        },
        {
          role: "user",
          content: `Create a brief overview document with these sections:
1. What it is
2. Key features
3. Common use cases

Return a TipTap JSON structure:
1. Level 1 heading with title and emoji
2. Level 2 headings for sections
3. Bullet points for features/uses
4. Keep it concise

Use this structure: ${JSON.stringify(initialContent, null, 2).slice(0, 400)}...

Content to analyze:
${scrapeResult.markdown?.slice(0, 1000)}`
        }
      ],
      tools,
      tool_choice: {
        type: "function",
        function: { name: "generate_tiptap_content" }
      },
      temperature: 0.7,
      max_tokens: 4096
    })

    console.log('Content generation completed in', Date.now() - startTime, 'ms')
    
    const toolCall = completion.choices[0]?.message?.tool_calls?.[0]
    if (!toolCall?.function?.arguments) {
      throw new Error('Failed to generate content')
    }

    const { tiptap } = JSON.parse(toolCall.function.arguments)
    return { tiptap }
  } catch (error) {
    console.error('Error in processContent:', error)
    throw error
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log('Starting scrape request...')

  try {
    const { url, name, category } = await request.json()
    console.log('Processing URL:', url)

    if (!url) {
      console.log('Empty URL, returning default content')
      return NextResponse.json({
        success: true,
        content: {
          markdown: "Start typing to get started with your notes...",
          title: name || "New Document",
          description: `Empty document in ${category}`,
          url: "",
          tiptap: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1, textAlign: "left" },
                content: [
                  {
                    type: "emoji",
                    attrs: { name: "memo" }
                  },
                  {
                    type: "text",
                    text: ` ${name || "New Document"}`
                  }
                ]
              },
              {
                type: "paragraph",
                attrs: { textAlign: "left" },
                content: [
                  {
                    type: "text",
                    text: "Start typing to get started with your notes..."
                  }
                ]
              }
            ]
          }
        },
        metadata: {
          total: 1,
          completed: 1,
          creditsUsed: 0,
          expiresAt: new Date().toISOString(),
          hasMore: false
        }
      })
    }

    console.log('Starting URL scrape...')
    const scrapeStartTime = Date.now()
    
    const scrapePromise = firecrawl.scrapeUrl(url, { 
      formats: ['markdown', 'html'] 
    });

    const timeoutPromise = new Promise<ScrapeResponse>((_, reject) => 
      setTimeout(() => reject(new Error('Scrape operation timed out')), 12000)
    );

    const scrapeResult = await Promise.race([scrapePromise, timeoutPromise]);

    console.log('URL scrape completed in', Date.now() - scrapeStartTime, 'ms')

    if (!scrapeResult.success) {
      console.error('Scrape failed:', scrapeResult.error)
      return NextResponse.json(
        { error: `Failed to scrape: ${scrapeResult.error}` },
        { status: 400 }
      )
    }

    const { tiptap } = await processContent(scrapeResult)

    const response = {
      success: true,
      content: {
        markdown: "Content available in rich text editor",
        title: scrapeResult.metadata?.title || name,
        description: scrapeResult.metadata?.description || '',
        url,
        tiptap
      },
      metadata: {
        total: 1,
        completed: 1,
        creditsUsed: 1,
        expiresAt: new Date().toISOString(),
        hasMore: false
      }
    }

    console.log('Total request time:', Date.now() - startTime, 'ms')
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error processing content:', error)
    return NextResponse.json({ error: 'Failed to process content' }, { status: 500 })
  }
} 