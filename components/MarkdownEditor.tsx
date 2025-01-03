"use client"

import { cn } from "@/lib/utils"
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    DiffSourceToggleWrapper,
    InsertTable,
    ListsToggle,
    MDXEditor,
    type MDXEditorMethods,
    type MDXEditorProps,
    UndoRedo,
    diffSourcePlugin,
    headingsPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    quotePlugin,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
} from "@mdxeditor/editor"
import "@mdxeditor/editor/style.css"
import type { ForwardedRef } from "react"
import { useEffect, useState } from "react"

export function MarkdownEditor({
    editorRef,
    plugins,
    contentEditableClassName,
    ...props
}: {
    editorRef: ForwardedRef<MDXEditorMethods> | null
    plugins?: MDXEditorProps["plugins"]
    contentEditableClassName?: string
} & MDXEditorProps): React.ReactNode {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return <div className="min-h-[500px] bg-zinc-900" />
    }

    return (
        <div className="markdown-editor-wrapper [&_.mdxeditor-toolbar]:!bg-zinc-800 [&_.mdxeditor-toolbar]:!border-zinc-700">
            <MDXEditor
                ref={editorRef}
                trim={false}
                contentEditableClassName={cn(
                    "prose dark:prose-invert max-w-none", // Formatting breaks without 'prose'
                    contentEditableClassName,
                    "[&_p]:text-foreground",
                    "[&_ul]:text-foreground",
                    "[&_ol]:text-foreground",
                  )}
                plugins={[
                    toolbarPlugin({
                        toolbarContents: () => (
                            <>
                                <div className="flex flex-row gap-x-3">
                                    <UndoRedo />
                                    <BlockTypeSelect />
                                    <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
                                    <ListsToggle options={["bullet", "number"]} />
                                    <InsertTable />
                                </div>
                                <DiffSourceToggleWrapper options={["rich-text", "source"]}>
                                    <div></div>
                                </DiffSourceToggleWrapper>
                            </>
                        ),
                    }),
                    headingsPlugin(),
                    diffSourcePlugin(),
                    tablePlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    markdownShortcutPlugin(),
                    thematicBreakPlugin(),
                    ...(plugins ?? []),
                ]}
                {...props}
            />
        </div>
    )
} 