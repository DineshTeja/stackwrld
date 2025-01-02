import { NextResponse } from 'next/server'
import FirecrawlApp from '@mendable/firecrawl-js'

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || ''
})

type CrawlResponse = {
  success: boolean
  id: string
  url: string
} | {
  success: false
  error: string
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // First, submit the crawl job
    const submitResponse = await firecrawl.crawlUrl(url, {
      limit: 100,
      scrapeOptions: { formats: ['markdown', 'html'] }
    }) as CrawlResponse

    if (!submitResponse.success || !('id' in submitResponse)) {
      return NextResponse.json(
        { error: 'error' in submitResponse ? submitResponse.error : 'Failed to start crawl' },
        { status: 400 }
      )
    }

    // Check crawl status
    const crawlResponse = await firecrawl.checkCrawlStatus(submitResponse.id)

    if (!crawlResponse.success) {
      return NextResponse.json(
        { error: `Failed to check crawl status: ${crawlResponse.error}` },
        { status: 400 }
      )
    }

    const firstPage = crawlResponse.data[0]
    if (!firstPage) {
      return NextResponse.json({ error: 'No content found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      status: crawlResponse.status,
      content: {
        markdown: firstPage.markdown,
        title: firstPage.metadata?.title || '',
        description: firstPage.metadata?.description || '',
        url: firstPage.metadata?.sourceURL || ''
      },
      metadata: {
        total: crawlResponse.total,
        completed: crawlResponse.completed,
        creditsUsed: crawlResponse.creditsUsed,
        expiresAt: crawlResponse.expiresAt,
        hasMore: Boolean(crawlResponse.next)
      }
    })
  } catch (error) {
    console.error('Error crawling content:', error)
    return NextResponse.json({ error: 'Failed to crawl content' }, { status: 500 })
  }
} 