import { NextResponse } from 'next/server'
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js'
import OpenAI from 'openai'
import { initialContent } from '@/lib/data/initialContent'

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || ''
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { url, name, category } = await request.json()

    // Handle empty URL with default content
    if (!url) {
      const defaultContent = {
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
      }

      return NextResponse.json({
        success: true,
        content: defaultContent,
        metadata: {
          total: 1,
          completed: 1,
          creditsUsed: 0,
          expiresAt: new Date().toISOString(),
          hasMore: false
        }
      })
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

    // First get the markdown content like before
    const markdownCompletion = await openai.chat.completions.create({
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
    const formattedMarkdown = markdownCompletion.choices[0].message.content
      ?.trim()
      .replace(/^```markdown\s*/, '')
      .replace(/\s*```$/, '')
      || ''

    // Now generate TipTap JSON structure with a more explicit prompt
    const tiptapCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a JSON generator that creates TipTap-compatible document structures. Always respond with valid JSON only, no explanations or other text."
        },
        {
          role: "user",
          content: `Convert this markdown into a TipTap JSON document structure.
Use this example structure for reference: ${JSON.stringify(initialContent, null, 2)}

Rules:
1. Return ONLY the JSON object, no other text
2. Start with a level 1 heading containing the title
3. Include an emoji node in the heading (choose an appropriate emoji)
4. Convert markdown headings, paragraphs, code blocks, and lists
5. Preserve all formatting including bold, links, etc
6. Use the same node structure as the example

Markdown to convert:

${formattedMarkdown}`
        }
      ],
      response_format: { type: "json_object" } // Force JSON response
    })

    let tiptapContent;
    try {
      tiptapContent = JSON.parse(tiptapCompletion.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Failed to parse TipTap JSON:', error)
      // Fallback to a basic structure if parsing fails
      tiptapContent = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1, textAlign: 'left' },
            content: [{ type: 'text', text: scrapeResult.metadata?.title || 'Document' }]
          },
          {
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [{ type: 'text', text: formattedMarkdown }]
          }
        ]
      }
    }

    return NextResponse.json({
      success: true,
      content: {
        markdown: formattedMarkdown,
        title: scrapeResult.metadata?.title || '',
        description: scrapeResult.metadata?.description || '',
        url: url,
        tiptap: tiptapContent
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