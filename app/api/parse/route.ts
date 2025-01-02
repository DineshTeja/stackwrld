import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Category } from '@/types/document'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

type ParsedInput = {
  name: string
  category: Category | ""
  url: string
  description: string
}

export async function POST(request: Request) {
  try {
    const { input } = await request.json()

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts structured information from natural language input. 
          Extract the following information:
          1. Name of the tool/library/framework (required)
          2. Category (must be one of: Frontend/Design, ORM/Database, Authentication, Security, State Management, Testing, API/Backend, DevOps, Documentation, Monitoring)
          3. Documentation URL (if not provided, find the official documentation URL)
          4. Brief description (2-3 sentences max)
          
          Respond in JSON format with the following structure:
          {
            "name": "string",
            "category": "string",
            "url": "string",
            "description": "string"
          }`
        },
        {
          role: "user",
          content: input
        }
      ],
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    // Validate category
    const validCategories = [
      "Frontend/Design",
      "ORM/Database",
      "Authentication",
      "Security",
      "State Management",
      "Testing",
      "API/Backend",
      "DevOps",
      "Documentation",
      "Monitoring"
    ]

    const parsedResult: ParsedInput = {
      name: result.name || '',
      category: validCategories.includes(result.category) ? result.category as Category : "",
      url: result.url || '',
      description: result.description || ''
    }

    return NextResponse.json(parsedResult)

  } catch (error) {
    console.error('Error parsing input:', error)
    return NextResponse.json({ error: 'Failed to parse input' }, { status: 500 })
  }
} 