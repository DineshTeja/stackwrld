import { useState } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Category } from "@/types/document"
import { motion, AnimatePresence } from "framer-motion"

type AddDocumentFormProps = {
    isProcessing: boolean
    onSubmit: (data: { name: string, category: Category, url: string }) => void
}

export function AddDocumentForm({
    isProcessing,
    onSubmit
}: AddDocumentFormProps) {
    const [url, setUrl] = useState("")
    const [name, setName] = useState("")
    const [category, setCategory] = useState<Category | "">("")
    const [isNaturalInput, setIsNaturalInput] = useState(false)
    const [naturalInput, setNaturalInput] = useState("")
    const [isParsing, setIsParsing] = useState(false)

    const handleNaturalInput = async () => {
        if (!naturalInput.trim()) return

        try {
            setIsParsing(true)
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: naturalInput })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to parse input')
            }

            if (data.name && data.category && data.url) {
                onSubmit({
                    name: data.name,
                    category: data.category as Category,
                    url: data.url
                })
                if (!isProcessing) {
                    setNaturalInput("")
                    setIsNaturalInput(false)
                }
            } else {
                setName(data.name)
                setCategory(data.category)
                setUrl(data.url)
                setIsNaturalInput(false)
            }
        } catch (error) {
            console.error('Error parsing input:', error)
            setIsNaturalInput(false)
        } finally {
            setIsParsing(false)
        }
    }

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (category && name && url) {
            onSubmit({ name, category: category as Category, url })
            if (!isProcessing) {
                setUrl("")
                setName("")
                setCategory("")
            }
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <button
                        type="button"
                        onClick={() => setIsNaturalInput(false)}
                        className={`px-2 py-1 rounded relative ${!isNaturalInput ? 'text-white' : 'hover:text-zinc-300'}`}
                    >
                        {!isNaturalInput && (
                            <motion.div
                                layoutId="inputMode"
                                className="absolute inset-0 bg-zinc-800 rounded"
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">manual</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsNaturalInput(true)}
                        className={`px-2 py-1 rounded relative ${isNaturalInput ? 'text-white' : 'hover:text-zinc-300'}`}
                    >
                        {isNaturalInput && (
                            <motion.div
                                layoutId="inputMode"
                                className="absolute inset-0 bg-zinc-800 rounded"
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">natural</span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isNaturalInput ? (
                    <motion.div
                        key="natural"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex gap-3"
                    >
                        <Input
                            placeholder="Try: 'Add Prisma ORM, it's a toolkit for all sorts of database operations/management, https://www.prisma.io/'"
                            value={naturalInput}
                            onChange={(e) => setNaturalInput(e.target.value)}
                            className="flex-1 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400 rounded-md"
                            disabled={isParsing || isProcessing}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleNaturalInput()
                                }
                            }}
                        />
                        <Button
                            onClick={handleNaturalInput}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-md px-6"
                            disabled={isParsing || isProcessing}
                        >
                            {isParsing ? "parsing..." : "stack.push"}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.form
                        key="manual"
                        onSubmit={handleManualSubmit}
                        className="flex gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Input
                            placeholder="Name (e.g. Tailwind CSS)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-[240px] bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400 rounded-md"
                            disabled={isProcessing}
                        />
                        <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="Frontend/Design">Frontend/Design</SelectItem>
                                <SelectItem value="ORM/Database">ORM/Database</SelectItem>
                                <SelectItem value="Authentication">Authentication</SelectItem>
                                <SelectItem value="Security">Security</SelectItem>
                                <SelectItem value="State Management">State Management</SelectItem>
                                <SelectItem value="Testing">Testing</SelectItem>
                                <SelectItem value="API/Backend">API/Backend</SelectItem>
                                <SelectItem value="DevOps">DevOps</SelectItem>
                                <SelectItem value="Documentation">Documentation</SelectItem>
                                <SelectItem value="Monitoring">Monitoring</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            type="url"
                            placeholder="Documentation URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400 rounded-md"
                            disabled={isProcessing}
                        />
                        <Button
                            type="submit"
                            className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-md px-6"
                            disabled={isProcessing || !url || !name || !category}
                        >
                            {isProcessing ? "pushing..." : "stack.push"}
                        </Button>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    )
} 