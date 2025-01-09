import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { Category } from '@/types/document'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
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

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "parse_document",
          description: "Parse document information from natural language input",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the tool/library/framework"
              },
              category: {
                type: "string",
                enum: [
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
                ],
                description: "Category of the tool/library/framework"
              },
              url: {
                type: "string",
                description: "Documentation URL of the tool/library/framework"
              },
              description: {
                type: "string",
                description: "Brief description (2-3 sentences max)"
              }
            },
            required: ["name", "category", "url", "description"]
          }
        }
      }
    ]

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts structured information from natural language input about development tools and libraries. Extract the name, category, documentation URL, and a brief description.`
        },
        {
          role: "user",
          content: input
        }
      ],
      tools: tools,
      tool_choice: {
        type: "function",
        function: { name: "parse_document" }
      },
      temperature: 0.1,
      max_tokens: 4096
    })

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0]

    if (!toolCall?.function?.arguments) {
      throw new Error('Failed to parse input')
    }

    const result = JSON.parse(toolCall.function.arguments)

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