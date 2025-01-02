import React from 'react'

type CodeBlockProps = {
    node?: unknown
    inline?: boolean
    className?: string
    children: React.ReactNode
}

export function CodeBlock({ inline, className, children }: CodeBlockProps) {
    const content = String(children).trim()

    if (inline || !content.includes('\n')) {
        return (
            <code className="bg-zinc-800/50 px-1.5 py-0.5 rounded text-sm">
                {children}
            </code>
        )
    }

    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''

    return (
        <div className="relative my-4 max-w-full">
            {language && (
                <div className="absolute top-2 right-2 text-xs text-zinc-400">
                    {language}
                </div>
            )}
            <pre className="bg-zinc-800/50 p-4 rounded-lg overflow-x-auto max-w-full">
                <code className={className}>
                    {children}
                </code>
            </pre>
        </div>
    )
} 