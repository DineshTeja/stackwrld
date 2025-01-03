'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import type { Tables } from "@/types/schema"
import { BlockEditor } from "@/components/BlockEditor"
import { Doc } from 'yjs'
import NoSSR from './NoSSR'

interface DocumentDialogProps {
    doc: Tables<"documents"> | null
    onClose: () => void
    onUpdate: () => Promise<void>
}

export function DocumentDialog({ doc, onClose, onUpdate }: DocumentDialogProps) {
    const [ydoc, setYdoc] = useState<Doc | null>(null)

    // Initialize ydoc when dialog opens
    useEffect(() => {
        if (doc) {
            setYdoc(new Doc())
        }
        return () => {
            // Cleanup ydoc when dialog closes
            if (ydoc) {
                ydoc.destroy()
            }
        }
    }, [doc?.id])

    return (
        <Dialog open={!!doc} onOpenChange={onClose}>
            <DialogContent className="bg-black text-white border-zinc-800 max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col dark">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-4 text-xs">
                        <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                            {doc?.category}
                        </span>
                        <span className={`px-2 py-1 rounded ${doc?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                            doc?.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-red-500/10 text-red-500'
                            }`}>
                            {doc?.status}
                        </span>
                        {doc?.content?.url && (
                            <a
                                href={doc.content.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/20 transition-colors truncate max-w-[200px]"
                            >
                                {new URL(doc.content.url).hostname}
                            </a>
                        )}
                    </div>
                    <DialogTitle className="text-xl">{doc?.title}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto relative dark">
                    <NoSSR>
                        {ydoc && doc && (
                            <BlockEditor
                                ydoc={ydoc}
                                provider={null}
                                documentId={doc.id}
                                content={doc.content}
                                onUpdate={onUpdate}
                            />
                        )}
                    </NoSSR>
                </div>
            </DialogContent>
        </Dialog>
    )
} 