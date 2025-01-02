import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { ArrowRight } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip"
import type { Tables } from "@/types/schema"

type DocumentCardProps = {
    doc: Tables<"documents">
    onSelect: (doc: Tables<"documents">) => void
    onDelete: (id: string) => void
}

export function DocumentCard({ doc, onSelect, onDelete }: DocumentCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
        >
            <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors rounded-sm group">
                <CardContent className="p-4">
                    <div className="flex flex-col h-[120px]">
                        <div className="flex items-start justify-between">
                            <div
                                className="cursor-pointer"
                                onClick={() => doc.status === 'active' && onSelect(doc)}
                            >
                                <h3 className="font-medium text-sm text-zinc-100">
                                    {doc.title}
                                </h3>
                                <p className="text-xs text-zinc-400">
                                    {doc.preview}
                                </p>
                            </div>
                            {doc.status === 'active' && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                className="h-8 w-8 p-1 text-zinc-400 hover:text-zinc-100 flex-shrink-0"
                                                onClick={() => onSelect(doc)}
                                            >
                                                <ArrowRight className="h-6 w-6" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">View notes</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                                    {doc.category}
                                </span>
                                <span className={`px-2 py-1 rounded ${doc.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : doc.status === 'pending'
                                        ? 'bg-yellow-500/10 text-yellow-500'
                                        : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {doc.status}
                                </span>
                                {doc.content?.url && (
                                    <a
                                        href={doc.content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/20 transition-colors truncate max-w-[150px]"
                                    >
                                        {new URL(doc.content.url).hostname}
                                    </a>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(doc.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-400 hover:bg-transparent px-2"
                            >
                                .pop
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
} 